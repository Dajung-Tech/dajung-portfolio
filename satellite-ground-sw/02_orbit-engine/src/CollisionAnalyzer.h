#include "Definition.h"
#include <vector>


/// @brief 충돌 분석 결과
struct CollisionResult {
    double min_distance;    //unit : km(kilometer)
    double tca;             //unit : sec(seconds)
    bool collision_rist;
};

class CollistionAnalyzer {
public:
    /// @brief 두 궤도를 이용하여 threshold 내 충돌 여부 확인 함수
    /// @param trajectory_a A 궤도
    /// @param trajectorry_b B 궤도
    /// @param threshold 충돌 임계치 (unit : km)
    /// @return 
    CollisionResult Analyze(
        const std::vector<PropagationPoint>& trajectory_a, 
        const std::vector<PropagationPoint>& trajectorry_b, 
        double threshold  
    ) const;
};