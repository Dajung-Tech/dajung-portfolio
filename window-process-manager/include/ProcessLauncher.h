// 프로세스 실행 전담
#pragma once

#include <string>

class ProcessLauncher {
public:
    bool Launch(const std::wstring& commandLine, unsigned long& pid) const;
};