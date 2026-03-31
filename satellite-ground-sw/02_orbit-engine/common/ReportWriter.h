#include "Definition.h"
#include "Scenario.h"
#include "CollisionAnalyzer.h"

#include <string>

class ReportWriter {
public:
    /// @brief 분석 결과를 CSV 포맷으로 반환합니다.
    /// @param path 출력 경로
    /// @param trajectory 궤도
    void WriteCsv(
        const std::string& path, 
        const std::vector<PropagationPoint>& trajectory
    ) const;

    /// @brief 분석 결과를 txt 포맷으로 반환합니다.
    /// @param path 출력 경로
    /// @param result 
    void WriteSummary(
        const std::string& path, 
        const CollisionResult& result
    ) const;

    /// @brief 분석 결과를 HTML 포맷으로 반환합니다.
    /// @param path 출력 경로
    /// @param scenario 
    /// @param result 
    void WriteHtml(
        const std::string& path, 
        const Scenario& scenario, 
        const CollisionResult& result
    ) const;
};