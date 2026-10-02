import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainTabParamList, RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authApi } from "@/features/auth/api/auth.api";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorView } from "@/components/common/ErrorView";

import { CollectionCarousel } from "@/features/collections/components/CollectionCarousel";
import { CollectionHeroCard } from "@/features/collections/components/CollectionHeroCard";
import { CollectionSkeleton } from "@/features/collections/components/CollectionSkeleton";
import { usePublishedCollections } from "@/features/collections/hooks/usePublishedCollections";

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "HomeTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { user } = useAuth();
  const [quota, setQuota] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const collectionsQuery = usePublishedCollections();
  const collections = useMemo(
    () => collectionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [collectionsQuery.data],
  );
  const featuredCollection = collections[0] ?? null;
  const remainingCollections = collections.slice(1);

  const fetchQuota = async () => {
    try {
      const data = await authApi.getUserQuota();
      setQuota(data);
    } catch (err) {
      console.warn("Failed to load quota:", err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchQuota(), collectionsQuery.refetch()]);
    setRefreshing(false);
  };

  const handleCollectionPress = useCallback(
    (slug: string) => {
      navigation.navigate("CollectionDetail", { slug });
    },
    [navigation],
  );

  const handleCollectionsEndReached = useCallback(() => {
    if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage) {
      void collectionsQuery.fetchNextPage();
    }
  }, [collectionsQuery]);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-row items-center justify-between bg-surface-lowest px-xl pt-xxl pb-lg">
        <View>
          <Text className="text-body-sm text-on-surface-variant">
            Xin chào,
          </Text>
          <Text className="text-xxl font-bold text-on-surface">
            {user?.name || user?.email || "Người dùng"}
          </Text>
        </View>
        <View className="rounded-full bg-primary-container px-md py-xs">
          <Text className="text-body-sm font-bold tracking-wide text-on-primary">
            {user?.tier || "FREE"}
          </Text>
        </View>
      </View>

      <View className="gap-lg py-xl">
        <View className="gap-xs px-lg">
          <Text className="text-xs font-bold tracking-wider text-primary-container">
            KHÁM PHÁ PHONG CÁCH
          </Text>

          <Text className="text-xxl font-bold text-on-surface">
            Bộ sưu tập nổi bật
          </Text>

          <Text className="text-sm leading-5 text-on-surface-variant">
            Những thiết kế đã được công bố, sẵn sàng để bạn khám phá.
          </Text>
        </View>

        {collectionsQuery.isLoading && collections.length === 0 ? (
          <CollectionSkeleton />
        ) : collectionsQuery.isError && collections.length === 0 ? (
          <ErrorView
            title="Chưa thể tải bộ sưu tập"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => void collectionsQuery.refetch()}
          />
        ) : collections.length === 0 ? (
          <EmptyState
            icon="◇"
            title="Chưa có bộ sưu tập"
            description="Các bộ sưu tập mới sẽ được cập nhật tại đây."
          />
        ) : (
          <>
            {collectionsQuery.isError ? (
              <View
                accessibilityRole="alert"
                className="mx-lg min-h-12 flex-row items-center gap-md rounded-md bg-surface-low px-md py-md"
              >
                <Text className="flex-1 text-xs text-on-surface-variant">
                  Chưa thể cập nhật danh sách mới nhất.
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.68}
                  onPress={() => void collectionsQuery.refetch()}
                  className="min-h-11 justify-center px-sm"
                >
                  <Text className="text-xs font-bold text-primary-container">
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {featuredCollection ? (
              <View className="px-lg">
                <CollectionHeroCard
                  collection={featuredCollection}
                  onPress={handleCollectionPress}
                />
              </View>
            ) : null}

            {remainingCollections.length > 0 ? (
              <View className="gap-md">
                <Text className="px-lg text-base font-bold text-on-surface">
                  Khám phá thêm
                </Text>
                <CollectionCarousel
                  collections={remainingCollections}
                  isFetchingNextPage={collectionsQuery.isFetchingNextPage}
                  onEndReached={handleCollectionsEndReached}
                  onPressCollection={handleCollectionPress}
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Quota Card */}
      <View className="m-xl rounded-xl border border-surface-line bg-surface-lowest p-xl shadow-sm">
        <Text className="text-body-lg font-bold text-on-surface">
          Hạn mức AI hôm nay
        </Text>
        <Text className="mt-1 text-body-sm text-on-surface-variant">
          Virtual Try-On & AI Stylist được cấp theo gói dịch vụ của bạn.
        </Text>
        {quota ? (
          <View className="mt-lg flex-row border-t border-surface-line pt-lg">
            <View className="flex-1 items-center">
              <Text className="text-xxl font-extrabold text-primary-container">
                {quota.remaining ?? "-"}
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">
                Lượt còn lại
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xxl font-extrabold text-primary-container">
                {quota.limit ?? "-"}
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">
                Tổng hạn mức
              </Text>
            </View>
          </View>
        ) : (
          <Text className="mt-md text-body-sm italic text-outline">
            Đang cập nhật hạn mức...
          </Text>
        )}
      </View>

      {/* Quick Action Grid */}
      <Text className="mx-xl mt-sm mb-md text-headline-sm text-on-surface">
        Tính năng nổi bật
      </Text>
      <View className="flex-row gap-md px-xl">
        <TouchableOpacity
          className="min-h-11 flex-1 rounded-xl border border-surface-line bg-surface-lowest p-lg"
          onPress={() => navigation.navigate("TryOnTab")}
          activeOpacity={0.7}
        >
          <Text className="mb-sm text-icon-lg">👗</Text>
          <Text className="mb-1 text-body-lg font-bold text-on-surface">
            Virtual Try-On
          </Text>
          <Text className="text-body-sm leading-4 text-on-surface-variant">
            Thử trang phục với ảnh người thật bằng AI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="min-h-11 flex-1 rounded-xl border border-surface-line bg-surface-lowest p-lg"
          onPress={() => navigation.navigate("Stylist")}
          activeOpacity={0.7}
        >
          <Text className="mb-sm text-icon-lg">✦</Text>
          <Text className="mb-1 text-body-lg font-bold text-on-surface">
            AI Stylist
          </Text>
          <Text className="text-body-sm leading-4 text-on-surface-variant">
            Phân tích màu sắc, vóc dáng và cách phối đồ
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
