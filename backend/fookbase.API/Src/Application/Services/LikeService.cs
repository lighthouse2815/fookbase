using InteractHub.Api.Application.DTOs.Likes;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class LikeService : ILikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LikeService(
        ILikeRepository likeRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<LikeStateResponseDto> LikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, user.Id, cancellationToken);
        if (existingLike is null)
        {
            var now = DateTime.UtcNow;

            await _likeRepository.AddAsync(new Like
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                UserId = user.Id,
                CreatedAt = now
            }, cancellationToken);

            if (post.UserId != user.Id)
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = post.UserId,
                    ActorUserId = user.Id,
                    PostId = post.Id,
                    Type = "LIKE",
                    Message = "Someone liked your post.",
                    IsRead = false,
                    CreatedAt = now
                }, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var likeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken);

        return new LikeStateResponseDto
        {
            PostId = post.Id,
            Liked = true,
            LikeCount = likeCount
        };
    }

    public async Task<LikeStateResponseDto> UnlikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, userId, cancellationToken);
        if (existingLike is not null)
        {
            _likeRepository.Remove(existingLike);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var likeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken);

        return new LikeStateResponseDto
        {
            PostId = post.Id,
            Liked = false,
            LikeCount = likeCount
        };
    }
}
