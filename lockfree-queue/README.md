## Problem
SPSC(Single Producer, Single Consumer) 환경에서 
lock contention을 최소화하면서도 안전하게 데이터를 전달할 수 있는 큐 필요

## Solution
C++의 atomic 연산을 활용하여 mutex 의존도를 줄이고, 
producer와 consumer가 독립적으로 동작할 수 있는 lock-free queue 설계

## Result
SPSC 환경에 적합한 lock-free queue를 구현하였고,
불필요한 lock 사용을 줄여 동시성 처리 구조를 단순화함

## Test
lockfree-queue의 성능 검증을 위해 다음과 같은 항목의 테스트를 수행함
다음중 5번 항목은 테스트 실패로 종료됨
1. 버퍼 할당 후 함수 유효성 확인 : count(), size(), is_empty(), dequeue(), pop()
2. 할당된 버퍼만큼 데이터를 추가하며 함수 유효성 확인 : enqueue(), dequeue(), count(), is_empty()
3. 할당된 버퍼만큼 데이터를 추가하며 함수 유효성 확인 : push(), pop(), is_empty()
4. SPSC(Single-Producer, Single-Consumer) 환경에서의 데이터 유실/중복/변조/불일치 등 기능 확인
5. MPMC(Multi-Producer, Multi-Consumer) 환경에서의 데이터 유실/중복/변조/불일치 등 기능 확인

---

### 구성 설명
- core : SPSC 환경에서의 lock-free queue 
- tests : 구글 테스트 프레임워크를 이용하여 lock-free queue 기능 검증 수행

---

## 빌드 방법
### macOS / Linux
```
mkdir build
cd build

cmake ..
cmake --build .

cd tests
./unit_lockfree_queue_test
```