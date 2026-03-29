// 프로세스 목록 조회
#pragma once

#include <vector>
#include "ProcessInfo.h"

class ProcessManager {
public:
    std::vector<ProcessInfo> ListProcess() const;
};