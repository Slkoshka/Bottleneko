using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Bottleneko.Server.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class UsersController(NekoDbContext db) : CrudController<UsersController.CreateUserRequest, UsersController.UpdateUserRequest>
{
    private async Task<ClaimsIdentity?> GetIdentityAsync(string login, string password)
    {
        login = login.Trim().ToLowerInvariant();

        var user = await db.Users.SingleOrDefaultAsync(user => user.Login == login && !user.IsDeleted);
        if (user is null || !user.CheckPassword(password))
        {
            return null;
        }

        return new ClaimsIdentity([
            new Claim(ClaimsIdentity.DefaultNameClaimType, user.Id.ToString()),
            new Claim(ClaimsIdentity.DefaultRoleClaimType, user.Role.ToString()),
        ], "Token", ClaimsIdentity.DefaultNameClaimType, ClaimsIdentity.DefaultRoleClaimType);
    }

    public record LoginRequest(string Login, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request)
    {
        var identity = await GetIdentityAsync(request.Login, request.Password);
        if (identity is null)
        {
            return Error(ErrorCode.Unauthorized, "Invalid username or password");
        }

        var jwt = new JwtSecurityToken(
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow + TimeSpan.FromDays(30),
            claims: identity.Claims,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(NekoOptions.GetRequiredOption<OptionSecretKey>().Key), SecurityAlgorithms.HmacSha512)
        );

        return Ok(new
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(jwt),
        });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMeAsync()
    {
        if (await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == User.Identity!.Name) is { } user)
        {
            return Ok(user.ToDto());
        }
        else
        {
            return Error(ErrorCode.NotFound, "User not found");
        }
    }

    public record CreateUserRequest(string Login, string Password);

    public override async Task<IActionResult> AddAsync([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Login))
        {
            return Error(ErrorCode.InvalidValue, "Username cannot be empty");
        }
        else if (string.IsNullOrEmpty(request.Password))
        {
            return Error(ErrorCode.InvalidValue, "Passwordcannot be empty");
        }

        try
        {
            var user = UserEntity.Create(request.Login, request.Password, UserRole.Administrator);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new
            {
                Result = user.ToDto(),
            });
        }
        catch (Exception e) when (e.IsDuplicateKeyException())
        {
            throw new DuplicateNameException($"User with the name '{request.Login}' already exists");
        }
    }

    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Result = await db.Users.Where(u => !u.IsDeleted).Select(user => user.ToDto()).ToArrayAsync(),
        });
    }

    public override async Task<IActionResult> GetAsync([FromRoute] long id)
    {
        if (await db.Users.SingleOrDefaultAsync(u => u.Id == id && !u.IsDeleted) is { } user)
        {
            return Ok(user.ToDto());
        }
        else
        {
            return Error(ErrorCode.NotFound, "User not found");
        }
    }

    public record UpdateUserRequest(string? Login, string? Password);

    public override async Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] UpdateUserRequest request)
    {
        if (await db.Users.SingleOrDefaultAsync(u => u.Id == id) is { } user)
        {
            if (request.Login is not null)
            {
                user.Rename(request.Login);
            }
            if (request.Password is not null)
            {
                user.ChangePassword(request.Password);
            }

            try
            {
                await db.SaveChangesAsync();
                return Ok(new
                {
                    Result = user.ToDto(),
                });
            }
            catch (Exception e) when (e.IsDuplicateKeyException())
            {
                throw new DuplicateNameException($"User with the name '{request.Login}' already exists");
            }
        }
        else
        {
            return Error(ErrorCode.NotFound, "User not found");
        }
    }

    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return Error(ErrorCode.NotFound, "User not found");
        }

        if (User.Identity!.Name == user.Id.ToString())
        {
            return Error(ErrorCode.InvalidOperation, "Cannot delete current user");
        }

        user.Delete();
        await db.SaveChangesAsync();
        return Ok(new Success());
    }
}
