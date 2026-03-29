#include "Definition.h"

#include <string>

/// @brief 
struct Scenario {
    StateVector object_a;
    StateVector object_b;
    double duration;                //unit : sec(seconds)
    double step;                    //unit : sec(seconds)
    double collision_threshold;     //unit : km(kilometer)
};

class ScenarioLoader{
public:
    /// @brief 파일 기반을 통해 시나리오를 로드합니다.
    /// @param path 시나리오 파일 경로
    /// @return 
    Scenario LoadFromFile(const std::string& path) const;
};