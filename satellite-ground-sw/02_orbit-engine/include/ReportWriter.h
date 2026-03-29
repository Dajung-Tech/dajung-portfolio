#include "Definition.h"
#include "Scenario.h"
#include "CollisionAnalyzer.h"

#include <string>

class ReportWriter {
public:
    void WriteCsv(
        const std::string& path, 
        const std::vector<PropagationPoint>& trajectory
    ) const;

    void WriteSummary(
        const std::string& path, 
        const CollisionResult& result
    ) const;

    void WriteHtml(
        const std::string& path, 
        const Scenario& scenario, 
        const CollisionResult& result
    ) const;
};