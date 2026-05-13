using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class HashtagService : IHashtagService
{
    private readonly IHashtagRepository _hashtagRepository;
    private readonly IUnitOfWork _unitOfWork;

    public HashtagService(IHashtagRepository hashtagRepository, IUnitOfWork unitOfWork)
    {
        _hashtagRepository = hashtagRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<HashtagResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _hashtagRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        var mappedItems = await items.ToResponseDtosAsync(_hashtagRepository.CountPostUsageAsync, cancellationToken);

        return PagedResult<HashtagResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<HashtagResponseDto>> SearchAsync(string keyword, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        if (string.IsNullOrWhiteSpace(keyword))
        {
            throw new BusinessException(ErrorCode.HASHTAG_KEYWORD_REQUIRED);
        }

        var (items, totalCount) = await _hashtagRepository.SearchPagedAsync(keyword, query.Page, query.PageSize, cancellationToken);
        var mappedItems = await items.ToResponseDtosAsync(_hashtagRepository.CountPostUsageAsync, cancellationToken);

        return PagedResult<HashtagResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<HashtagResponseDto> GetByIdAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        var hashtag = await _hashtagRepository.GetByIdAsync(hashtagId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.HASHTAG_NOT_FOUND);

        return await hashtag.ToResponseDtoAsync(_hashtagRepository.CountPostUsageAsync, cancellationToken);
    }

    public async Task<HashtagResponseDto> CreateAsync(CreateHashtagRequestDto request, CancellationToken cancellationToken)
    {
        var normalizedName = NormalizeName(request.Name);

        var existing = await _hashtagRepository.GetByNameAsync(normalizedName, cancellationToken);
        if (existing is not null)
        {
            throw new BusinessException(ErrorCode.HASHTAG_ALREADY_EXISTS);
        }

        var now = DateTime.UtcNow;

        var hashtag = new Hashtag
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _hashtagRepository.AddAsync(hashtag, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await hashtag.ToResponseDtoAsync(_hashtagRepository.CountPostUsageAsync, cancellationToken);
    }

    public async Task<HashtagResponseDto> UpdateAsync(Guid hashtagId, UpdateHashtagRequestDto request, CancellationToken cancellationToken)
    {
        var hashtag = await _hashtagRepository.GetByIdForUpdateAsync(hashtagId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.HASHTAG_NOT_FOUND);

        var normalizedName = NormalizeName(request.Name);

        var duplicate = await _hashtagRepository.GetByNameAsync(normalizedName, cancellationToken);
        if (duplicate is not null && duplicate.Id != hashtag.Id)
        {
            throw new BusinessException(ErrorCode.HASHTAG_ALREADY_EXISTS);
        }

        hashtag.Name = normalizedName;
        hashtag.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await hashtag.ToResponseDtoAsync(_hashtagRepository.CountPostUsageAsync, cancellationToken);
    }

    public async Task DeleteAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        var hashtag = await _hashtagRepository.GetByIdForUpdateAsync(hashtagId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.HASHTAG_NOT_FOUND);

        var usageCount = await _hashtagRepository.CountPostUsageAsync(hashtag.Id, cancellationToken);
        if (usageCount > 0)
        {
            throw new BusinessException(ErrorCode.HASHTAG_IN_USE);
        }

        _hashtagRepository.Remove(hashtag);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeName(string value)
    {
        var normalized = value.Trim().TrimStart('#').ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException(ErrorCode.HASHTAG_NAME_REQUIRED);
        }

        return normalized;
    }
}



