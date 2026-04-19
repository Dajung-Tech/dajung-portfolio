# Hi, I'm Dajung!
Problem-solving Backend / System Engineer
# 대규모 트래픽 제어 및 고가용성 시스템 설계 경험을 가진 서버 엔지니어 입니다.

## What I Do
- High-performance backend & system design (C++, C#)
- Concurrency control & queue-based architecture
- Performance optimization & bottleneck analysis
- Fault-tolerance system design (Fail-over / Fail-back)
- Complex domain system design (Satellite mission planning)

## Projectes
### 1. Traffic Control Engine (C, C++, Python)
요청 폭주 상황에서도 안정적인 처리를 위한 Queue 기반 트래픽 제어 시스템
- SPSC 기반 Command Queue + Single Worker Thread 구조
- 요청 상태 기반 및 대기열 기반 처리 모델 설계
- Client와 Interactive한 대기 상태 전달을 통해 고부하 상황에서 타임아웃 및 재시도 감소
- 고가용성(Fail-Over/Fail-Back) 확보를 위한 시스템 설계 및 개발

[상세 보기] 
- ./interactive-queue-system
- ./lockfree-queue

### 2. Satellite Mission Planning System (C#, MS-SQL, WPF)
복잡한 위성 도메인을 기반으로 한 임무 계획 시스템 설계
- 다중 위성, 다중 유저 환경에 대응한 아키텍처 설계
- 위성체 및 탑재체 문서를 기반으로 한 연산 시스템 개발
- 연산 성능 최적화 (5.5배 향상)

[상세 보기]
- ./satellite-ground-sw

### 3. UAV Control & GCS System
- Dual Loop PID control
- MAVLink protocol communication
- Real-Time telemetry & visualization

### 4. 기타
#### 4.1 Place-flow (Java, Spring Boot, MySQL, Podman, REST API)
오프라인 매장 서비스에서 사용자 요청(주문/결제)을 안정적으로 처리하기 위한 백엔드 시스템 개발 
[상세 보기] ./place-flow

## Tech Stack
- Languages : C++, C#, C, JAVA, Python
- System : Multithreading, Queue, Concurrency
- DB : MS-SQL, SQLite, MySQL
- Tools : Git, Jira, OKTAL, Docker, Podman

## Links
- Notion Portfolio: https://www.notion.so/3338d0df493a80dabe53e73bd4da6fd1?source=copy_link
