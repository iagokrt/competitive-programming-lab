#define UNIT_TEST

#include "solution.cpp"

#include <cassert>

int main() {
    assert(sum(10, 9) == 19);
    assert(sum(-10, 4) == -6);

    return 0;
}
