using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema;

public enum UserRole
{
    Administrator,
}

[Index(nameof(Login), IsUnique = true)]
public class UserEntity : Entity
{
    public const int PasswordLength = 64;
    public const int SaltLength = 64;
    
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string Login { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string DisplayName { get; set; }
    public required UserRole Role { get; set; }
    [MaxLength(PasswordLength)]
    public required byte[] Password { get; set; }
    [MaxLength(SaltLength)]
    public required byte[] Salt { get; set; }
    public required DateTime LastLogin { get; set; }
    
    public bool CheckPassword(string password)
    {
        var hash = GetPasswordHash(password, Salt);
        return CryptographicOperations.FixedTimeEquals(Password, hash);
    }
    
    private static byte[] GetPasswordHash(string password, byte[] salt)
    {
        return Rfc2898DeriveBytes.Pbkdf2(password, salt, 210000, HashAlgorithmName.SHA512, UserEntity.PasswordLength);
    }
    
    private static byte[] GenerateSalt()
    {
        return RandomNumberGenerator.GetBytes(UserEntity.SaltLength);
    }

    public static UserEntity Create(string username, string password, UserRole role)
    {
        var salt = GenerateSalt();
        return new UserEntity()
        {
            Login = username.ToLowerInvariant().Trim(),
            DisplayName = username.Trim(),
            Password = GetPasswordHash(password, salt),
            Salt = salt,
            Role = role,
            LastLogin = DateTime.MinValue,
        };
    }
    
    public void Rename(string userName)
    {
        Login = userName.ToLowerInvariant().Trim();
        DisplayName = userName.Trim();
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void ChangePassword(string password)
    {
        var salt = GenerateSalt();
        Salt = salt;
        Password = GetPasswordHash(password, salt);
        LastUpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        IsDeleted = true;
        Login = $"deleted_user_{Id}";
    }
}
