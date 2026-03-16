## Problem
SPSC(Single Producer, Single Consumer) 환경에서 
lock contention을 최소화하면서도 안전하게 데이터를 전달할 수 있는 큐 필요

## Solution
C++의 atomic 연산을 활용하여 mutex 의존도를 줄이고, 
producer와 consumer가 독립적으로 동작할 수 있는 lock-free queue 설계

## Result
SPSC 환경에 적합한 lock-free queue를 구현하였고,
불필요한 lock 사용을 줄여 동시성 처리 구조를 단순화함
