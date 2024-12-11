"use client";

import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import LoadingIndicator from "@/app/components/common/LoadingIndicator";
import { fetchPost } from "@/app/utils/postUtils";
import { BsChatDots } from "react-icons/bs";
import { useNotificationContext } from "@/app/contexts/NotificationContext";
import * as api from "@/app/api";
import {
  FullPost as PostType,
  Comment,
  ClientSelfUser,
  ApiResponse,
} from "@/app/types/global";
import { useUserContext } from "@/app/contexts/UserContext";
import ModalsContext from "@/app/contexts/ModalsContext";

import AuthorInfo from "@/app/components/post/AuthorInfo";
import ImageCarousel from "@/app/components/post/ImageCarousel";
import LikeButton from "@/app/components/post/LikeButton";
import CommentSection from "@/app/components/post/CommentSection";
import { ImBin2 } from "react-icons/im";
import { AxiosResponse } from "axios";

export default function PostPage() {
  const { addNotification } = useNotificationContext();

  const { user } = useUserContext() as { user: ClientSelfUser };
  const params = useParams();
  const postId = useMemo(
    () => (params.id ? parseInt(params.id as string, 10) : null),
    [params.id]
  );

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentImage, setCurrentImage] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tormoz, setTormoz] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"image" | "details" | "comments">(
    "image"
  );

  const { openModal } = useContext(ModalsContext);

  function handleDeletePost() {
    if (!post) return;

    api
      .deleteAPost(post.id)
      .then((response: AxiosResponse<ApiResponse<void>>) => {
        if (response.data.status === "success") {
          addNotification({
            status: "success",
            message: "Post deleted successfully.",
          });
        }
      })
      .catch(() => {
        addNotification({
          status: "error",
          message: "Failed to delete post.",
        });
      });
  }

  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }
      try {
        const fetchedPost = await fetchPost(postId);
        if (fetchedPost) {
          setPost(fetchedPost);
          setLikeCount(fetchedPost._count?.Likes ?? fetchedPost.Likes.length);
          setComments(fetchedPost.Comments);
          if (
            user &&
            fetchedPost.Likes.some(
              (like: { userId: number }) => like.userId === user.id
            )
          ) {
            setIsLiked(true);
          }
        }
      } catch {
        addNotification({
          status: "error",
          message: "Could not fetch post.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId, user, addNotification]);

  const handleLikeClick = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      if (!user) {
        addNotification({
          status: "error",
          message: "You have to be logged in to like posts.",
          link_to: "/authentication",
        });
        return;
      }

      if (!post) return;

      if (tormoz) {
        return;
      }

      setTormoz(true);

      const previousLikedState = isLiked;
      const previousLikeCount = likeCount;
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setLikeCount((prev) => (newLikeState ? prev + 1 : prev - 1));

      try {
        const response = await api.likePost(post.id);
        if (response.data.status !== "success") {
          throw new Error(response.data.message || "Failed to update like.");
        }
      } catch {
        setIsLiked(previousLikedState);
        setLikeCount(previousLikeCount);
        addNotification({
          status: "error",
          message: "Could not update like.",
        });
      } finally {
        setTormoz(false);
      }
    },
    [user, post, isLiked, addNotification, tormoz, likeCount]
  );

  const handleImageClick = useCallback(() => {
    if (post && post.ImageInPost.length > 0) {
      openModal("FULL_SCREEN_IMAGE", {
        imageUrl: post.ImageInPost[currentImage].picpath,
        onClose: () => {},
      });
    }
  }, [post, currentImage, openModal]);

  const handlePrevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!post) return;
      setCurrentImage((prev) =>
        prev === 0 ? post.ImageInPost.length - 1 : prev - 1
      );
    },
    [post]
  );

  const handleNextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!post) return;
      setCurrentImage((prev) => {
        const nextIndex = (prev + 1) % post.ImageInPost.length;
        return nextIndex;
      });
    },
    [post]
  );

  const handleAddComment = useCallback(
    (commentText: string) => {
      if (!user) {
        addNotification({
          status: "error",
          message: "Please log in to add a comment.",
          link_to: "/authentication",
        });
        return;
      }

      if (commentText.trim() === "") {
        addNotification({
          status: "error",
          message: "Please enter a comment first.",
        });
        return;
      }

      if (!post) return;

      const tempId = Date.now();

      const addedComment: Comment = {
        id: tempId,
        userId: user.id,
        postId: post.id,
        comment: commentText.trim(),
        picpath: null,
        createdAt: new Date().toISOString(),
        User: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
      };

      setComments((prev) => [...prev, addedComment]);

      api
        .uploadComment(post.id, commentText.trim())
        .then((response) => {
          if (response.data.status === "success") {
            addNotification({
              status: "success",
              message: response.data.message,
            });

            setComments((prev) =>
              (prev as Comment[]).filter((comment) => comment.id !== undefined)
            );
          } else {
            throw new Error(response.data.message || "Unknown error");
          }
        })
        .catch(() => {
          setComments((prev) =>
            prev.filter((comment) => comment.id !== tempId)
          );

          addNotification({
            status: "error",
            message: "Failed to add comment.",
          });
        });
    },
    [user, post, addNotification]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[85vh] md:h-[90vh]">
        <LoadingIndicator />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-[85vh] md:h-[90vh]">
        <p className="text-gray-700 dark:text-gray-300">Post not found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Мобильная версия */}
      <div className="flex flex-col items-center justify-center px-4 py-6 gap-6 h-[85vh] md:hidden">
        {/* Вкладки */}
        <div className="flex justify-around w-full border-b">
          <button
            className={`px-4 ${
              activeTab === "image"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : ""
            }`}
            onClick={() => setActiveTab("image")}
          >
            Image
          </button>
          <button
            className={`px-4 ${
              activeTab === "details"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`px-4 ${
              activeTab === "comments"
                ? "border-b-2 border-yellow-500 text-yellow-500"
                : ""
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="flex-grow w-full overflow-y-auto">
          {activeTab === "image" && (
            <div className="h-full">
              <ImageCarousel
                images={post.ImageInPost}
                currentIndex={currentImage}
                onPrev={handlePrevImage}
                onNext={handleNextImage}
                onImageClick={handleImageClick}
              />
            </div>
          )}
          {activeTab === "details" && (
            <div className="">
              <AuthorInfo user={post.User} createdAt={post.createdAt} />
              {/* Заголовок и описание */}
              <div className="mt-4">
                <h1 className="font-bold text-3xl mb-4 text-yellow-500">
                  {post.name}
                </h1>
                <p className="text-gray-700 dark:text-gray-300">
                  {post.description}
                </p>
              </div>
              {/* Кнопки лайка и комментариев */}
              <div className="flex items-center gap-6 mt-4">
                <LikeButton
                  isLiked={isLiked}
                  likeCount={likeCount}
                  onLike={handleLikeClick}
                />
                <button
                  className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition-colors duration-200"
                  onClick={() => setActiveTab("comments")}
                  aria-label="View Comments"
                >
                  <BsChatDots size={20} />
                  <span>{comments.length}</span>
                </button>
              </div>
            </div>
          )}
          {activeTab === "comments" && (
            <div className="h-full flex flex-col">
              <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
              />
            </div>
          )}
        </div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden md:flex flex-row items-center justify-center px-4 py-6 gap-6 h-[90vh]">
        {/* Карусель изображений */}
        <div className="w-1/2 h-full">
          <ImageCarousel
            images={post.ImageInPost}
            currentIndex={currentImage}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            onImageClick={handleImageClick}
          />
        </div>

        {/* Секция контента */}
        <div className="w-1/2 h-full flex flex-col rounded-lg shadow-2xl p-6 overflow-hidden">
          {/* Информация об авторе */}
          <AuthorInfo user={post.User} createdAt={post.createdAt} />

          {/* Заголовок и описание */}
          <div className="mt-4">
            <div className="flex flex-row items-center justify-between">
              <h1 className="font-bold text-3xl mb-4 text-yellow-500">
                {post.name}
              </h1>

              {user?.bananaLevel > 0 && (
                <ImBin2
                  size={20}
                  onClick={handleDeletePost}
                  className="cursor-pointer"
                />
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {post.description}
            </p>
          </div>

          {/* Кнопки лайка и комментариев */}
          <div className="flex items-center gap-6 mt-4">
            <LikeButton
              isLiked={isLiked}
              likeCount={likeCount}
              onLike={handleLikeClick}
            />
            <button
              className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition-colors duration-200"
              onClick={() => {
                const commentSection =
                  document.getElementById("comments-section");
                if (commentSection) {
                  commentSection.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
              aria-label="View Comments"
            >
              <BsChatDots size={20} />
              <span>{comments.length}</span>
            </button>
          </div>

          {/* Секция комментариев */}
          <div
            className="flex-grow flex flex-col overflow-hidden"
            id="comments-section"
          >
            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
            />
          </div>
        </div>
      </div>
    </>
  );
}
