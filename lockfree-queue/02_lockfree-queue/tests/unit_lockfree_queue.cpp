#include <gtest/gtest.h>

#include <mutex>
#include <thread>
#include <vector>

#include "../core/lockfreequeue_sptr.hpp"

template <typename T>
using LFQ = lockfreequeue_sptr<T>;

struct ItemMpmc {
  int producer_id;
  uint64_t seq;
};

///==========================================================
/// 1. 단일 스레드 동작 테스트 - 기본 함수
///==========================================================

// 1-1. 버퍼 할당 후 함수 유효성 확인 : count(), size(), is_empty(), dequeue(), pop()
TEST(LockFreeQueueBasic, EmptyQueueBehaviorCorrectly) {
  LFQ<int> q(8);

  int v = -1;
  EXPECT_TRUE(q.is_empty());
  EXPECT_EQ(q.count(), 0u);
  EXPECT_EQ(q.size(), 8u);

  EXPECT_FALSE(q.dequeue(v));
  EXPECT_FALSE(q.pop(v));
  EXPECT_TRUE(q.is_empty());
  EXPECT_EQ(q.count(), 0u);
}

// 1-2. (할당된 버퍼 -1)만큼 데이터를 추가하며 함수 유효성 확인 : enqueue(), dequeue(), count(), is_empty()
TEST(LockFreeQueueBasic, SingleThreadFifoOrder_EnqueueDequeue) {
  LFQ<int> q(8);

  const int N = 7;
  for (int i = 0; i < N; ++i) {
    EXPECT_TRUE(q.enqueue(i));
    EXPECT_EQ(q.count(), static_cast<size_t>(i + 1));
  }

  EXPECT_FALSE(q.enqueue(999));
  for (int i = 0; i < N; ++i) {
    int v = -1;
    ASSERT_TRUE(q.dequeue(v));
    EXPECT_EQ(v, i);
    EXPECT_EQ(q.count(), static_cast<size_t>(N - i - 1));
  }

  EXPECT_TRUE(q.is_empty());
  EXPECT_EQ(q.count(), 0u);
}

// 1-3. (할당된 버퍼 -1) 만큼 데이터를 추가하며 함수 유효성 확인 : push(), pop(), is_empty()
TEST(LockFreeQueueBasic, SingleThreadFifoOrder_PushPop) {
  LFQ<int> q(8);

  const int N = 7;
  for (int i = 0; i < N; ++i) {
    EXPECT_TRUE(q.push(i));
  }

  EXPECT_FALSE(q.push(999));  // size over로 실패

  for (int i = 0; i < N; ++i) {
    int v = -1;
    ASSERT_TRUE(q.pop(v));
    EXPECT_EQ(v, i);
  }

  EXPECT_TRUE(q.is_empty());
}

///==========================================================
/// 2. 다중 스레드 동작 테스트
///==========================================================

// 2-1. 단일 Producer, 단일 Consumer 환경에서의 유실/중복/변조/불일치 등의 기능 확인
TEST(LockFreeQueue_Concurrent, SingleProducerSingleConsumer) {
  const int capacity = 1024;
  const int n = 100000;

  LFQ<int> q(capacity);

  std::atomic<int> produced{0};
  std::atomic<int> consumed{0};

  std::vector<int> consumed_values;
  consumed_values.reserve(n);
  std::mutex consumed_mutex;

  // Producer thread
  std::thread producer([&]() {
    for (int i = 0; i < n; ++i) {
      // bounded queue이므로 가끔 full일 수 있음 → 성공할 때까지 반복
      while (!q.enqueue(i)) {
        std::this_thread::yield();
      }
      produced.fetch_add(1, std::memory_order_relaxed);
    }
  });

  // Consumer thread
  std::thread consumer([&]() {
    while (consumed.load(std::memory_order_relaxed) < n) {
      int v = -1;
      if (q.dequeue(v)) {
        {
          std::lock_guard<std::mutex> lg(consumed_mutex);
          consumed_values.push_back(v);
        }
        consumed.fetch_add(1, std::memory_order_relaxed);
      } else {
        // 잠깐 비어 있을 수 있음
        std::this_thread::yield();
      }
    }
  });

  producer.join();
  consumer.join();

  ASSERT_EQ(produced.load(), n);
  ASSERT_EQ(consumed.load(), n);

  {
    std::lock_guard<std::mutex> lg(consumed_mutex);
    ASSERT_EQ(static_cast<int>(consumed_values.size()), n);
  }

  // FIFO 확인: 순서대로 나왔는지
  {
    std::lock_guard<std::mutex> lg(consumed_mutex);
    for (int i = 0; i < n; ++i) {
      EXPECT_EQ(consumed_values[i], i);
    }
  }

  EXPECT_TRUE(q.is_empty());
  EXPECT_EQ(q.count(), 0u);
}

// 2-2. 다중 Producer, 다중 Consumer 환경에서의 유실/중복/변조/불일치 등의 기능 확인
TEST(LockFreeQueue_Concurrent, MultiProducerMultiConsumer) {
  const int producer = 4;
  const int consumer = 4;
  const int per_producer = 5000;
  const int total = producer * per_producer;
  const int capacity = 1024;

  LFQ<ItemMpmc> q(capacity);

  std::atomic<int> produced_count{0};
  std::atomic<int> consumed_count{0};

  std::vector<ItemMpmc> consumed;
  consumed.reserve(total);
  std::mutex consumed_mutex;

  // producer
  std::vector<std::thread> producers;
  producers.reserve(producer);

  for (int pid = 0; pid < producer; ++pid) {
    producers.emplace_back([&, pid]() {
      for (int i = 0; i < per_producer; ++i) {
        ItemMpmc it({pid, static_cast<uint64_t>(i)});

        while (!q.enqueue(it)) {
          std::this_thread::yield();
        }

        produced_count.fetch_add(1, std::memory_order_relaxed);
      }
    });
  }

  // consumer
  std::vector<std::thread> consumers;
  consumers.reserve(consumer);

  for (int cid = 0; cid < consumer; ++cid) {
    consumers.emplace_back([&]() {
      while (true) {
        int current = consumed_count.load(std::memory_order_relaxed);
        if (current >= total) {
          break;
        }

        ItemMpmc it;
        if (q.dequeue(it)) {
          {
            std::lock_guard<std::mutex> lg(consumed_mutex);
            consumed.push_back(it);
          }
          consumed_count.fetch_add(1, std::memory_order_relaxed);
        } else {
          std::this_thread::yield();
        }
      }
    });
  }

  for (auto& th : producers)
    th.join();
  for (auto& th : consumers)
    th.join();

  ASSERT_EQ(produced_count.load(), total);
  ASSERT_EQ(consumed_count.load(), total);

  {
    std::lock_guard<std::mutex> lg(consumed_mutex);
    ASSERT_EQ(static_cast<int>(consumed.size()), total);
  }

  // 데이터 검증
  {
    std::lock_guard<std::mutex> lg(consumed_mutex);

    std::sort(consumed.begin(), consumed.end(), [](const ItemMpmc& a, const ItemMpmc& b) {
      if (a.producer_id != b.producer_id)
        return a.producer_id < b.producer_id;
      return a.seq < b.seq;
    });

    int idx = 0;
    for (int pid = 0; pid < producer; ++pid) {
      for (int i = 0; i < per_producer; ++i, ++idx) {
        ASSERT_LT(idx, total);
        EXPECT_EQ(consumed[idx].producer_id, pid);
        EXPECT_EQ(consumed[idx].seq, static_cast<uint64_t>(i));
      }
    }
  }

  EXPECT_TRUE(q.is_empty());
  EXPECT_EQ(q.count(), 0u);
}

#if !defined(USE_GTEST_MAIN_FROM_LIB)
int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
#endif