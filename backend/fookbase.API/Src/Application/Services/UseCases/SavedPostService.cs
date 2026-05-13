using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class SavedPostService : ISavedPostService
{
    private readonly ISavedPostRepository _savedPostRepository;
    private readonly IPostRepository _postRepository;
    private readonly IFriendshipReadModelService _friendshipReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SavedPostService> _logger;

    public SavedPostService(
        ISavedPostRepository savedPostRepository,
        IPostRepository postRepository,
        IFriendshipReadModelService friendshipReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<SavedPostService> logger)
    {
        _savedPostRepository = savedPostRepository;
        _postRepository = postRepository;
        _friendshipReadModelService = friendshipReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var blockedUserIds = await ResolveBlockedUserIdsAsync(userId, cancellationToken, requireFresh: true);
        var (items, totalCount) = await _savedPostRepository.GetPagedByUserAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken,
            blockedUserIds);

        var posts = items
            .Where(savedPost => savedPost.Post is not null)
            .Select(savedPost => savedPost.Post!)
            .ToList();

        var userIds = posts
            .Select(post => post.UserId)
            .Concat(posts.Where(post => post.OriginalPost is not null).Select(post => post.OriginalPost!.UserId));
        var profileLookup = await ResolveProfileLookupAsync(userIds, cancellationToken);
        var shareCounts = await _postRepository.GetShareCountsAsync(
            posts.Select(post => post.Id).ToList(),
            cancellationToken);

        var mappedItems = posts
            .Select(post => post.ToSavedPostResponseDto(userId, profileLookup, blockedUserIds, shareCounts))
            .ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<SavedPostStateResponseDto> SaveAsync(
        Guid userId,
        SavePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(userId, cancellationToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        var existing = await _savedPostRepository.GetByUserAndPostAsync(userId, post.Id, cancellationToken);
        if (existing is not null)
        {
            return SavedPostMapper.ToStateResponseDto(post.Id, saved: true, savedAt: existing.CreatedAt);
        }

        var savedAt = DateTime.UtcNow;
        await _savedPostRepository.AddAsync(new SavedPost
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            UserId = userId,
            CreatedAt = savedAt
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return SavedPostMapper.ToStateResponseDto(post.Id, saved: true, savedAt: savedAt);
    }

    public async Task<SavedPostStateResponseDto> RemoveAsync(Guid userId, Guid postId, CancellationToken cancellationToken)
    {
        var existing = await _savedPostRepository.GetByUserAndPostForUpdateAsync(userId, postId, cancellationToken);
        if (existing is null)
        {
            return SavedPostMapper.ToStateResponseDto(postId, saved: false);
        }

        _savedPostRepository.Remove(existing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return SavedPostMapper.ToStateResponseDto(postId, saved: false);
    }

    private async Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveProfileLookupAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        return await _friendshipReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: requireFresh);
    }

}






