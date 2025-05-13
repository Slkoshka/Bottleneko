using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Database.Schema;
using Microsoft.EntityFrameworkCore;
using Bottleneko.Server.Utils;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class UsersController(NekoDbContext db) : CrudController<UsersController.CreateUserRequest, UsersController.UpdateUserRequest>
{
    public async Task<ClaimsIdentity?> GetIdentityAsync(string userName, string password)
    {
        userName = userName.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
        var user = await db.Users.SingleOrDefaultAsync(user => user.Login == userName.ToLowerInvariant() && !user.IsDeleted);
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
        if (user is null || !user.CheckPassword(password))
        {
            return null;
        }

        return new ClaimsIdentity([
            new Claim(ClaimsIdentity.DefaultNameClaimType, user.Id.ToString()),
            new Claim(ClaimsIdentity.DefaultRoleClaimType, user.Role.ToString()),
        ], "Token", ClaimsIdentity.DefaultNameClaimType, ClaimsIdentity.DefaultRoleClaimType);
    }
    
    public record LoginRequest(string Username, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request)
    {
        var identity = await GetIdentityAsync(request.Username, request.Password);
        if (identity is null)
        {
            return Error(ErrorCode.Unauthorized, "Invalid user name or password");
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

    public record CreateUserRequest(string Username, string Password);
    
    public override async Task<IActionResult> AddAsync([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = UserEntity.Create(request.Username, request.Password, UserRole.Administrator);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new
            {
                User = user.ToDto(),
            });
        }
        catch (Exception e) when (e.IsDuplicateKeyException())
        {
            throw new DuplicateNameException($"User with the name '{request.Username}' already exists");
        }
    }
    
    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Users = await db.Users.Where(u => !u.IsDeleted).Select(user => user.ToDto()).ToArrayAsync(),
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

    public record UpdateUserRequest(string Username, string? Password);
    
    public override async Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] UpdateUserRequest request)
    {
        if (await db.Users.SingleOrDefaultAsync(u => u.Id == id) is {  } user)
        {
            user.Rename(request.Username);
            if (request.Password is not null)
            {
                user.ChangePassword(request.Password);
            }

            try
            {
                await db.SaveChangesAsync();
                return Ok(new Success());
            }
            catch (Exception e) when (e.IsDuplicateKeyException())
            {
                throw new DuplicateNameException($"User with the name '{request.Username}' already exists");
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
