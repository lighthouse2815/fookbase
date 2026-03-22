namespace InteractHub.Api.Domain.Enums;

public enum UserRole
{
    ADMIN,
    USER
}

public enum UserStatus
{
    ACTIVE,
    BANNED,
    INACTIVE
}

public enum AuthProvider
{
    LOCAL,
    GOOGLE,
    FACEBOOK
}

public enum Gender
{
    MALE,
    FEMALE,
    OTHER
}

public enum FriendshipStatus
{
    PENDING,
    ACCEPTED,
    REJECTED,
    BLOCKED,
    REMOVED
}
