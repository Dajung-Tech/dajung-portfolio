# 락프리 큐 유닛 테스트 실행파일
add_executable(
    unit_lockfree_queue_test
    unit_lockfree_queue.cpp  
)

# include 경로 (소스/공용 헤더)
target_include_directories(unit_lockfree_queue_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/core
)

# 링크 라이브러리
target_link_libraries(unit_lockfree_queue_test PRIVATE
    GTest::gtest
    GTest::gtest_main
)

# CTest에 등록
add_test(
    NAME unit_lockfree_queue_test
    COMMAND unit_lockfree_queue_test
)