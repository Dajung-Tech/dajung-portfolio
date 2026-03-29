#pragma once
#include <string>

// 프로세스 정보를 담는 구조체
struct ProcessInfo {
    unsigned long pid;
    std::wstring name;
};