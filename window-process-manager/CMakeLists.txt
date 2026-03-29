cmake_minimum_required(VERSION 3.15)
project(window_process_manager)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_executable(window_process_manager
    src/main.cpp
    src/Menu.cpp
    src/ProcessManager.cpp
    src/ProcessLauncher.cpp
    src/ProcessTerminator.cpp
)