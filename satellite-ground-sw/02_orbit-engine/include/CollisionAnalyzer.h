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
    CollisionResult Analyze(
        const std::vector<PropagationPoint>& trajectory_a, 
        const std::vector<PropagationPoint>& trajectorry_b, 
        double threshold    //unit : km(kilometer)
    ) const;
};