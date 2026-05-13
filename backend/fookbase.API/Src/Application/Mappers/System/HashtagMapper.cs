using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class HashtagMapper
{
    public static HashtagResponseDto ToResponseDto(this Hashtag hashtag, int usageCount)
    {
        ArgumentNullException.ThrowIfNull(hashtag);

        return new HashtagResponseDto
        {
            Id = hashtag.Id,
            Name = hashtag.Name,
            UsageCount = usageCount,
            CreatedAt = hashtag.CreatedAt
        };
    }

    public static async Task<HashtagResponseDto> ToResponseDtoAsync(
        this Hashtag hashtag,
        Func<Guid, CancellationToken, Task<int>> resolveUsageCountAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(hashtag);
        ArgumentNullException.ThrowIfNull(resolveUsageCountAsync);

        var usageCount = await resolveUsageCountAsync(hashtag.Id, cancellationToken);
        return hashtag.ToResponseDto(usageCount);
    }

    public static async Task<List<HashtagResponseDto>> ToResponseDtosAsync(
        this IEnumerable<Hashtag> hashtags,
        Func<Guid, CancellationToken, Task<int>> resolveUsageCountAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(hashtags);
        ArgumentNullException.ThrowIfNull(resolveUsageCountAsync);

        var mapped = new List<HashtagResponseDto>();
        foreach (var hashtag in hashtags)
        {
            mapped.Add(await hashtag.ToResponseDtoAsync(resolveUsageCountAsync, cancellationToken));
        }

        return mapped;
    }
}
