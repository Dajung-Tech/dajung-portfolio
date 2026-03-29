// 프로세스 종료 전담
#pragma once

class ProcessTerminator {
public:
    bool Terminate(unsigned long pid) const;
};