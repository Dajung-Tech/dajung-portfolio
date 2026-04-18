include("/Users/dajung/Desktop/github/portfolio/dajung-portfolio/imaging-processing/MainWindow/build/Qt_6_11_0_for_macOS-Debug/.qt/QtDeploySupport.cmake")
include("${CMAKE_CURRENT_LIST_DIR}/MainWindow-plugins.cmake" OPTIONAL)
set(__QT_DEPLOY_I18N_CATALOGS "qtbase")

qt6_deploy_runtime_dependencies(
    EXECUTABLE "MainWindow.app"
)
