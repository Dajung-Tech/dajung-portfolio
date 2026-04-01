#pragma once

#ifndef LOCKFREEQUEUE_LOCKFREEQUEUE_SPTR_HPP
#define LOCKFREEQUEUE_LOCKFREEQUEUE_SPTR_HPP

#include <iostream>
#include <thread>
#include <atomic>

template <typename T>
class lockfreequeue_sptr {
public:
    lockfreequeue_sptr(size_t capacity) : capacity_(capacity), head_(0), tail_(0) {
        buffer_ = new std::unique_ptr<T>[capacity];
    }

    ~lockfreequeue_sptr() {
        delete[] buffer_;
    }

    bool enqueue(const T& value) {
        size_t current_tail = tail_.load(std::memory_order_relaxed);
        size_t next_tail = (current_tail + 1) % capacity_;

        if (next_tail == head_.load(std::memory_order_acquire)) {
            return false; // Queue is full
        }

        buffer_[current_tail] = std::make_unique<T>(value);
        tail_.store(next_tail, std::memory_order_release);
        return true;
    }

    bool push(const T& value) {
        size_t current_tail = tail_.load(std::memory_order_relaxed);
        size_t next_tail = (current_tail + 1) % capacity_;

        if (next_tail == head_.load(std::memory_order_acquire)) {
            return false; // Queue is full
        }

        buffer_[current_tail] = std::make_unique<T>(value);
        tail_.store(next_tail, std::memory_order_release);
        return true;
    }

    bool dequeue(T& value) {
        size_t current_head = head_.load(std::memory_order_relaxed);

        if (current_head == tail_.load(std::memory_order_acquire)) {
            return false; // Queue is empty
        }
        if (buffer_[current_head] == nullptr) {
            return false;
        }
        value = *buffer_[current_head];
        buffer_[current_head].reset(); // Release the memory
        head_.store((current_head + 1) % capacity_, std::memory_order_release);
        return true;
    }

    bool pop(T& value) {
        size_t current_head = head_.load(std::memory_order_relaxed);

        if (current_head == tail_.load(std::memory_order_acquire)) {
            return false; // Queue is empty
        }
        if (buffer_[current_head] == nullptr) {
            return false;
        }

        value = *buffer_[current_head];
        buffer_[current_head].reset(); // Release the memory
        head_.store((current_head + 1) % capacity_, std::memory_order_release);
        return true;
    }

    bool is_empty() {
        if (head_.load(std::memory_order_relaxed) == tail_.load(std::memory_order_acquire)) {
            return true; // Queue is empty
        }
        return false;
    }

    size_t count() const {
        size_t current_head = head_.load(std::memory_order_acquire);
        size_t current_tail = tail_.load(std::memory_order_acquire);

        if (current_tail >= current_head) {
            return current_tail - current_head;
        } else {
            return capacity_ - (current_head - current_tail);
        }
    }

    size_t size() const {
        return capacity_;
    }

private:
    std::unique_ptr<T>* buffer_;
    size_t capacity_;
    std::atomic<size_t> head_, tail_;
};


#endif //LOCKFREEQUEUE_LOCKFREEQUEUE_SPTR_HPP
