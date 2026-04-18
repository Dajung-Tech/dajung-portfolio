cmake_minimum_required(VERSION 3.19)
project(MainWindow LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Core Widgets LinguistTools)
find_package(OpenCV REQUIRED)

qt_standard_project_setup()

qt_add_executable(MainWindow
    WIN32 MACOSX_BUNDLE
    main.cpp
    mainwindow.cpp
    mainwindow.h
    mainwindow.ui
    ImageUtils.h
    ImageUtils.cpp

)

qt_add_translations(
    TARGETS MainWindow
    TS_FILES MainWindow_ko_KR.ts
)

target_include_directories(MainWindow PRIVATE ${OpenCV_INCLUDE_DIRS})

target_link_libraries(MainWindow
    PRIVATE
        Qt::Core
        Qt::Widgets
        ${OpenCV_LIBS}
)

install(TARGETS MainWindow
    BUNDLE  DESTINATION .
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
)

qt_generate_deploy_app_script(
    TARGET MainWindow
    OUTPUT_SCRIPT deploy_script
    NO_UNSUPPORTED_PLATFORM_ERROR
)
install(SCRIPT ${deploy_script})
