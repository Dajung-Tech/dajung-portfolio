### 1. Orbit Propagation
- 초기 상태벡터(Position, Velocity)를 기반으로 궤도 전파 수행
- 2-body 중력 모델 기반의 계산 수행
- RK4(Runge-Kutta 4차) 수치 적분 적용
- 시간(step) 단위로 상태 벡터 계산

### 2. Collision Analysis (진행 예정)
- 두 위성 간 궤도 비교
- 최소 거리(min distance) 계산
- 충돌 위험 여부 판단

### 3. Report Generation (진행 예정)
- 궤도 전파 결과 CSV 출력
- 분석 결과 TXT/HTML 리포트 생성
- 시나리오 기반 반복 시험 가

---

### 구성 설명
- core : 수학/물리 기반 데이터 구조
- src : 비행역학 기능 구현 (궤도 전파, 충돌 분석)
- common : 시나리오 및 리포트 관련 공통 모듈

---
## 빌드 방법
### macOS / Linux
```
cd 02_orbit-engine
mkdir build
cd build

cmake ..
cmake --build.

./02_orbit-engine
```

### Windows
```
cd 02_orbit-engine

cmake -B build
cmake --build build

./build/02_orbit-engin.exe
```
