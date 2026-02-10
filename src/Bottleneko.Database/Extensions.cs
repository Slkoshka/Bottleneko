using Microsoft.Data.Sqlite;

namespace Bottleneko.Database;

public static class Extensions
{
    public static bool IsDuplicateKeyException(this Exception exception)
    {
        return exception is
            SqliteException { SqliteErrorCode: SQLitePCL.raw.SQLITE_CONSTRAINT, SqliteExtendedErrorCode: SQLitePCL.raw.SQLITE_CONSTRAINT_UNIQUE or SQLitePCL.raw.SQLITE_CONSTRAINT_PRIMARYKEY } or
            { InnerException: SqliteException { SqliteErrorCode: SQLitePCL.raw.SQLITE_CONSTRAINT, SqliteExtendedErrorCode: SQLitePCL.raw.SQLITE_CONSTRAINT_UNIQUE or SQLitePCL.raw.SQLITE_CONSTRAINT_PRIMARYKEY } };
    }
}
