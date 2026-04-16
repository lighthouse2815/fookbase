package com.dang.app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Infrastructure-dependent smoke test is skipped in local unit-test runs.")
@SpringBootTest
class AppApplicationTests {

	@Test
	void contextLoads() {
	}

}
