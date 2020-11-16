---
title: "[Android] Android with JUnit5 (번역)"
date: 2020-11-01 18:49:51
category: "android"
template: "post"
description: "Android 진영에서 작성되는 대부분의 단위 테스트는 Android Studio 에서 제공되는 JUnit4 를 이용하여 작성된다. 이러한 테스트 케이스에 대해 우리가 직면했던 큰 문제중 하나는 "
tags: 
    - JUnit
    - Test
redirect_from:
  - /2020/11/01/android_with_junit5/
---
![cover](/media/cover/junit5.png)

본 글은 저자의 허락을 받고 해당 [글](https://medium.com/@boonkeat/android-unit-testing-with-junit5-d1b8f9c620b6)을 번역한 내용이다. 부족한 영어 실력으로 의역한 부분이 많아 본 저자의 의도와 다르게 작성된 부분이 있을 수 있는 점에 대해 미리 양해를 구한다.

Android 진영에서 작성되는 대부분의 단위 테스트는 Android Studio 에서 제공되는 JUnit4 를 이용하여 작성된다. 이러한 테스트 케이스에 대해 우리가 직면했던 큰 문제중 하나는 **가독성** 이슈였다. 일반적인 프로젝트에서 단위 테스트의 개수는 1000개 혹은 그 이상을 넘기기 쉬운데, 이러한 다수의 테스트 케이스가 있을 때 이에 대한 이름을 어떻게 지을 것인지가 문제였다. 네이밍이 잘못될 경우 테스트가 실패했을 때마다 해당 테스트가 무엇을 수행하는지 알기 위해 많은 에너지를 써야하기 때문이다.

이때 Junit5 을 사용할 경우 단위 테스트가 잘 문서화 될 수 있다.

해당 글은 두 부분으로 나뉜다.

첫 번째 파트에서는 테스트 케이스 네이밍 방법 및 JUnit5를 사용하는 동기에 대해 다룬다.
두 번째 파트는 Android 용 JUnit5 테스트를 작성하는 방법을 다룬다.

# 네이밍 발전 과정

처음 테스트 코드 작성 시 우리는 다음과 같이 이름을 짓게된다.

```kotlin
@Test
fun testWhenButtonClickedThenIfFlagTrueLaunchActivity(){...}
```

노력하면 가능할지도 모르지만, 일반적으로 이러한 네이밍의 테스트 코드를 볼 때 해당 테스트 클래스가 모든 케이스를 다루는지 확인 것은 꽤 힘이 드는 일이다. 해당 예제에서는 하나의 플래그만 다루지만, 만약 또다른 조건이 있다면? 수백개의 테스트 케이스를 거치면 머리가 지끈거릴 것이다.

그리고 우리는 코틀린에서 아래와 같이 표현이 가능함을 알게되었다.

```kotlin
@Test
fun `When button is clicked, If flag is true, then launch activity`() { ... }
```

또한 많은 사람들이 [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) 방식으로 테스트를 네이밍 하기위해 노력하고 있는 것을 알기에 조건(Given), 실행(When), 예상 결과(Then) 방식으로도 작성을 해봤다.

```kotlin
@Test
fun `Given flag is true, When button is clicked, Then activity is launched`(){ ... }
@Test
fun `Given flag is false, When button is clicked, Then activity is not launched`(){ ... }
```

초기 표현보다 좀 더 나아보인다. 하지만 아래와 같이 조건이 여러 개일 경우 여전히 읽는데 어려움이 있다.

```kotlin
@Test
fun `Given flag is true and listener null and user is logged out, When button is clicked, Then activity is launched and listener not called`(){ ... }
@Test
fun `Given flag is true and listener not null and user is logged out, When button is clicked, Then activity is launched and listener not called`(){ ... }
```

위 테스트에서 '유저가 로그아웃 되어있는 동안은 리스너가 호출되지 않음' 라는 사실을 쉽게 알 수 있었을까?

Android Studio 에서 이러한 형태의 테스트를 실행하면 다음과 같이 출력된다.
![example1](/media/post/junit5/junit.png)

수백개의 테스트 케이스를 가지고 있을 때 * test suite 는 단순히 코드를 전달하는 블랙박스가 된다. test suite 는 유용하지만 한편으로는 거대한 미로와 같다. 테스트 케이스가 실패했을 때 원인을 파악하기 위해서는 많은 비용이 발생한다.

*Test suite : 그룹화 된 테스트 케이스

# 잘 문서화 된 테스트 with JUnit5

JUnit5 에는 많은 기능이 새로 도입 되었고, 특히 다음 두 가지 기능이 안드로이드 테스트를 구성할 때 큰 도움이 된다.

- Nested Classes
- Display Name

세션 데이터의 상태에 따라 로그인/로그아웃이 되는 케이스에 대해 살펴보자.

순서대로 JUnit4, JUnit5 로 작성했을 때의 결과다.
![example2](/media/post/junit5/junit2.png)
![example3](/media/post/junit5/junit3.png)

JUnit 5 의 경우 테스트 내의 각 상황을 명확하게 인지할 수 있다. 추가로 로그인 상태에 따라 리스너가 호출되는 것을 확인하고 싶을 경우는 어떻게 할까?

![example4](/media/post/junit5/junit4.png)


누군가는 '단위'라는 맥락에서 볼 때 두 개 이상을 검증해서는 안된다고 주장할 수 있다. OK. 그렇다면 각각의 검증내용을 분리해보자.

![example5](/media/post/junit5/junit5.png)

여기서 JUnit5 을 이용할 경우 무엇을 검증하는지 더 잘 파악할 수 있다.

![example6](/media/post/junit5/junit6.png)

어떤 형태가 더 나은지 스스로 판단해보자. (특히 테스트가 실패했을 경우)

![example7](/media/post/junit5/junit7.png)

![example8](/media/post/junit5/junit8.png)

다음으로 안드로이드 내에서 어떻게 JUnit5 을 활용하여 테스트를 작성하는지 알아보자.

# JUnit 5 적용하기

JUnit5 의 컨셉과 적용 방법에 대해 자세하게 다룬 훌륭한 [글](https://www.lordcodes.com/articles/testing-on-android-using-junit-5) 이 이미 있다. 해당 글에서는 몇가지 간단한 내용만 다룰 것이다.

## Gradle 설정

[Marcel Schnelle](https://github.com/mannodermaus)이 만든 Gradle plugin 을 이용할 예정이다.

우선 root 레벨의 build.gradle 에 다음과 같이 플러그인을 추가한다.

```
buildscript {
  dependencies {
    classpath "de.mannodermaus.gradle.plugins:android-junit5:1.3.2.0"
  }
}
```

그리고 app 레벨의 bulid gradle 에 다음과 같이 plugin 을 적용하고 의존성을 추가한다.

```groovy
apply plugin: 'de.mannodermaus.android-junit5'

dependencies {
  testImplementation "org.junit.jupiter:junit-jupiter-api:5.3.2"
  testRuntimeOnly "org.junit.jupiter:junit-jupiter-engine:5.3.2"
  testImplementation "org.junit.jupiter:junit-jupiter-params:5.3.2"
  testRuntimeOnly "org.junit.vintage:junit-vintage-engine:5.3.2"
}
```

이 설정은 프로젝트에서 JUnit4 와 JUnit5 를 동시에 사용할 수 있도록 해준다. 

## 테스트 클래스

다음으로 Junit5 으로 작성한 테스트 클래스에 대해 살펴보자. 아래 클래스는 빈 클래스인데 아마 익숙한 형태일 것이다.

```kotlin
internal class ExampleJunitTest {

    @BeforeEach
    fun setup() {
        
    }

    @AfterEach
    fun tearDown() {
        
    }
    
    @Test
    fun test() {
    
    }
}
```

@BeforeEach 가 붙은 함수에서는 초기화 작업을 수행할 수 있다. 또한 해당 함수는 nested 여부와 상관없이 각 테스트 함수가 수행되기전에 항상 호출 된다.

```kotlin
internal class ExampleJunitTest {

    val mockUserSession: UserSession = mockk()
    lateinit var dut: MyClass
    
    @BeforeEach
    fun setup() {
        dut = MyClass(mockUserSession)
    }

    @AfterEach
    fun resetMocks() {
        clearMocks(mockUserSession)
    }

}
```

예제는 given, when, then 규칙에 맞추어 테스트 코드를 작성할 것이다. 해당 예제는 sessionData 의 유효성을 검사할 것이다. **given** 케이스에 해당하는 2개의 nested 클래스를 만들어준다.

```kotlin
internal class ExampleJunitTest {

    val mockUserSession: UserSession = mockk()
    lateinit var dut: MyClass
    
    @BeforeEach
    fun setup() {
        dut = MyClass(mockUserSession)
    }

    @AfterEach
    fun resetMocks() {
        clearMocks(mockUserSession)
    }
    
    @Nested
    @DisplayName("Given SessionData is valid")
    inner class SessionDataValid {
    }
    
    @Nested
    @DisplayName("Given SessionData is not valid")
    inner class SessionDataNotValid {
    }

}
```

각 nested 클래스는 각각 별도의 setup, teardown 함수를 소유할 수 있다. 각 클래스에 서로 다른 결과를 리턴하는 초기화 로직을 넣어보자. 

```kotlin
internal class ExampleJunitTest {

    val mockUserSession: UserSession = mockk()
    lateinit var dut: MyClass
    
    @BeforeEach
    fun setup() {
        dut = MyClass(mockUserSession)
    }

    @AfterEach
    fun resetMocks() {
        clearMocks(mockUserSession)
    }
    
    @Nested
    @DisplayName("Given SessionData is valid")
    inner class SessionDataValid {
        @BeforeEach
        fun setup() {
            every { mockUserSession.isValid() } returns true
        }
    }
    
    @Nested
    @DisplayName("Given SessionData is not valid")
    inner class SessionDataNotValid {
        @BeforeEach
        fun setup() {
            every { mockUserSession.isValid() } returns false
        }
    }

}
```

그 다음 **when** 케이스에 해당하는 클래스를 생성해보자.

```kotlin
internal class ExampleJunitTest {
    ...
    @Nested
    @DisplayName("Given SessionData is valid")
    inner class SessionDataValid {
        @BeforeEach
        fun setup() {
            every { mockUserSession.isValid() } returns true
        }
        
        @Nested
        @DisplayName("When onAppStart()")
        inner class OnAppStart() {
            @BeforeEach
            fun runTest() {
                dut.onAppStart()
            }
        }
    }
    ...
}
```

마지막으로 결과를 검증하는 then 케이스에 해당하는 테스트 함수를 추가해보자.

```kotlin
internal class ExampleJunitTest {
    ...
    @Nested
    @DisplayName("Given SessionData is valid")
    inner class SessionDataValid {
        @BeforeEach
        fun setup() {
            every { mockUserSession.isValid() } returns true
        }
        
        @Nested
        @DisplayName("When onAppStart()")
        inner class OnAppStart() {
            @BeforeEach
            fun runTest() {
                dut.onAppStart()
            }
            
            @Test
            @DisplayName("Then state changes to logged in")
            fun verifyLoggedIn() {
                // Add code to verify state change
            }
            
            /* other verifications or assertions *.
        }
    }
    ...
}
```

해당 테스트를 수행할 경우 아래와 같은 결과로 나타난다. 

![example9](/media/post/junit5/junit9.png)

다음과 같이 Nested 구조를 줄인 형태로도 구현할 수 있다.

```kotlin
internal class ExampleJunitTest {
    ...
    @Nested
    @DisplayName("Given SessionData is not valid")
    inner class SessionDataValid {
        @BeforeEach
        fun setup() {
            every { mockUserSession.isValid() } returns false
        }
        
        @Test
        @DisplayName("When onAppStart(), then state changes to logged in")
        fun verifyLoggedIn() {
            // Add code to verify state change
        }
        
        @Test
        @DisplayName("When onDestroy(), then flag changes to false")
        fun verifyFlagChange() {
            // Add code to verify state change
        }
    }
    ...
}
```

![example10](/media/post/junit5/junit10.png)


이런 식으로 작업할 경우 테스트 케이스를 디자인하는데 도움을 얻을 수 있다. 가령 다음과 같이 검증과정을 누락했을 경우 빠르게 확인이 가능하다.

When onDestroy(), then flag change to ?

한편 조건이나 검증해야 할 내용이 많을 경우 각 그룹을 명확하게 Nested 된 구조로 구성하는 것이 좀 더 낫다. 특정 조건에 대해 얼마나 잘 수행되었는지 파악하기가 더 수월하기 때문이다.

![example11](/media/post/junit5/junit11.png)

![example12](/media/post/junit5/junit12.png)

**@Nested** 클래스는 단순히 결과를 보기 좋게하기 위해 사용하는 것은 아니다. **@Nested** 클래스 는 각각 고유의 **@BeforeEach**, **@AfterEach** 를 수행할 수 있기 때문에 비슷한 범주에 속한 테스트를 같이 그룹화시킬 수 있다.

예를들어 5개의 테스트가 동일한 초기화 코드를 가지고 있을 경우 **@Nested** 클래스 내부에 넣고 하나의 **@BeforeEach** 에서 수행이 가능하다. 이때 클래스 이름은 적절하게 네이밍 되어야한다.

# 결론

해당 내용들은 Junit 5 의 일부분일 뿐이다. 미처 언급되지 않았지만 유용한 것들이 아직 많이 있다. 다른 개발자가 좀 더 쉽게 이해할 수 있도록 테스트 클래스를 디자인 하기 위해 지금 시작해보는 것은 어떨까?