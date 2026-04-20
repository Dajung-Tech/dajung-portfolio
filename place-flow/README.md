# 프로젝트 소개
PlaceFlow는 매장의 주문과 결제 흐름을 처리하는 백엔드 시스템입니다.

## 핵심 포인트
- 주문/결제 도메인 분리 설계
- Redis 기반 idempotency 적용
- DB + Redis 이중 중복 방어 구조
- 트랜잭션 기반 상태 정합성 보장

## 주요 기능
### 1. 주문 생성
- 주문 생성 API 제공
- 상태: CREATED

### 2. 결제 승인
- 주문 존재 여부 검증
- 결제 승인 처리
- 상태: CREATED -> PAID

### 3. 중복 요청 방지
- Redis 기반 idempotency key 적용
- 동일 requestId 요청 재처리 방지
#### 동작 방식
1. 요청 시 requestId를 Redis에 저장
2. 기 등록된 여부 확인을 통해, 이미 존재하면 중복 요청으로 간주
3. TTL 기반으로 일정 시간 후 자동 삭제

### 4. 중복 결제 방지
- paymentKey 기반 중복 결제 차단
- DB unique constraint 적용
- Redis와 함께 이중 방어 구조 구성

---------

# 기술 스택
- Language: Java
- Framework: Spring Boot
- Database: MySQL
- Cache: Redis
- ORM : JPA (Hibernate)
- Container: Podman

## 아키텍처 
Controller -> Service -> Repository 구조
- Controller: HTTP 요청/응답 처리
- Service: 비즈니스 로직 처리, 주문/결제 흐름 제어
- Repository: DB 접근(JPA)

---------

# APIs
## 1. 주문 생성
```
Endpoint: POST /orders
{
    "requestId": "order-req-001",
    "merchantId": 1,
    "totalAmount": 15000
}
```

## 2. 결제 승인
```
Endpoint: POST /payments/approve
{
    "requestId": "order-req-001",
    "orderId": 1,
    "paymentKey": "payment-key-001",
    "amount": 15000
}
```

## 3. 주문 조회
```
Endpoint: GET /orders/{id}
{}
```

# 예외 처리
- 중복 요청: 409
- 중복 결제: 409
- 주문 없음: 404

---------

# 실행 방법
## 1. MySQL 실행 (Podman)
```
podman run -d --name placeflow-mysql -e MYSQL_ROOT_PASSWORD=1234 -e MYSQL_DATABASE=placeflow -p 3306:3306 docker.io/library/mysql:8
```

## 2. Redis 실행 (Podman)
```
podman run -d --name placeflow-redis -p 6379:6379 docker.io/library/redis:7
```

## 3. 서버 실행
1. cd demo
2. ./gradlew bootRun

