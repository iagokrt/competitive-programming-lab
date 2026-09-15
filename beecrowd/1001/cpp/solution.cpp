// 1001 - Extremely Basic
// https://judge.beecrowd.com/en/problems/view/1001
//
// Topics: input/output, arithmetic

#include <iostream>

int sum(int a, int b) {
    return a + b;
}

#ifndef UNIT_TEST
int main() {
    int a;
    int b;

    std::cin >> a >> b;
    std::cout << "X = " << sum(a, b) << '\n';

    return 0;
}
#endif
