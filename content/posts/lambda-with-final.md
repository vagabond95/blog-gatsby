---
title: "[Java] lambda 와 effectively final"
date: 2020-09-28 17:30:07
category: "java"
template: "post"
description: "자바 8에서 추가된 람다식에는 다음과 같은 규칙이 존재한다."
tags: 
    - java 8
redirect_from:
  - /2020/09/28/lambda_with_effectively_final/
---
![](/media/cover/lambda_with_effectively_final.jpg)
자바 8에서 추가된 람다식에는 다음과 같은 규칙이 존재한다.

1. 람다식은 외부 block 에 있는 변수에 접근할 수 있다.
2. 외부에 있는 변수가 지역 변수 일 경우 final 혹은 effectively final 인 경우에만 접근이 가능하다.

이번 포스트에서는 effectively final 의 정의와 람다식에서 final or effectively final 인 외부 지역 변수만 사용할 할 수 밖에 없는 이유에 대해서 알아보려 한다.

# Effectively final 이란 무엇인가?

> A non-final local variable or method parameter whose value is never changed after initialization is known as effectively final.

Java 8 에 추가된 syntactic sugar 일종으로, **초기화 된 이후 값이 한번도 변경되지 않았다면** effectively final 이라고 할 수 있다. effectively final 변수는 final 키워드가 붙어있지 않았지만 final 키워드를 붙힌 것과 동일하게 컴파일러에서 처리한다. **'의미상 final 하다.'** 고 이해해도 괜찮을 것 같다.

## 적용 사례

Effectively final 은 anonymous class 나 람다식에서 코드를 좀 더 간결하게 만들어준다.

java 7 에서는 anonymous class 가 외부지역변수 가 final 인 경우에만 접근이 가능했기에 항상 final 키워드를 추가해줘야 했다. java 8 에서는 effectively final 인 경우에도 접근이 가능하게 바뀌어 조건을 만족한다면 final 키워드를 생략할 수 있다.

```java
// Java 7
public void testPlus() {
        final int number = 1;

        Addable addableImple = new Addable() {
            @Override
            public int plusOne() {
                return number + 1;
            }
        };
}

// Java 8
public void testPlus() {
        int number = 1; // Effectively final

        Addable addableImple = new Addable() {
            @Override
            public int plusOne() {
                return number + 1;
            }
        };
}
```

이는 lambda 식에서도 동일하다. (규칙 2를 상기해보자.)

```java
// Java 8
public void testPlus() {
    int number = 1; // Effectively final

    Addable addableImple = () -> number + 1;
}
```

# lambda 에서 사용되는 Local variable 은 왜 final or effectively final 이여야 할까?

각 단계별로 설명하기 위해 내용이 꽤 긴데,  결론 부분만 보아도 괜찮다.

## 먼저 확실히 정리할 것

헷갈릴 수 있는 표현을 먼저 정리하고자 한다. 해당 내용을 다루는 몇몇 글에서 '람다식에서 참조하는 **외부 변수**는 final 혹은 effectively final 이어야한다.' 라고 표현되는 것을 보았는데 이는 엄밀히 얘기하면 틀린 내용이다.

정확한 내용으로 수정하면 다음과 같다.

'람다식에서 참조하는 **외부 지역 변수**는 final 혹은 effectively final 이어야한다.'

외부 변수라는 단어에는 지역변수, 인스턴스 변수, 클래스 변수가 모두 포함될 수 있는데,  인스턴스 변수나 클래스 변수는 final 혹은 effective final 하지 않아도 람다식에서 사용할 수 있기 때문이다.

```java
private int instanceNumber = 1;
private static int staticNumber = 1;    
    
// Error, 외부 지역변수는 final 혹은 effectively final 이어야 람다식에서 사용할 수 있다.
public void testPlusByLocalVariable() {
    int localNumber = 1;

    localNumber = 2;
    Addable addableImple = () -> localNumber + 1; 
}
    
// OK, 값을 변경하더라도 문제 없다.
public void testPlusByInstanceVariable() {
    instanceNumber = 2;
    Addable addableImple = () -> instanceNumber + 1;
}

// OK, 값을 변경하더라도 문제 없다.
public void testPlusByStaticVariable() {
    staticNumber = 2;
    Addable addableImple = () -> staticNumber + 1;
}
```

너무 깐깐하다고 생각할 수 있지만 이 차이는 뒤에 설명될 내용과 밀접한 연관이 있기 때문에 미리 정확히 구분하는 것이 중요하다.

다시 해당 섹션의 주제로 돌아가서, 람다식에서 사용되는 지역변수가 final or effective final 이어야하는 이유를 알기 위해서는 Capturing lambda 라는 키워드를 살펴볼 필요가 있다.

## Capturing lambda 와 Non-Capturing lambda

람다식에는 2가지 타입이 존재한다.

- **Capturing lambda**

    외부 변수를 이용하는 람다식을 의미한다. 외부 변수는 지역변수, 인스턴스 변수, 클래스 변수를 모두 포함한다.

```java
String message = "CapturingLambda";
Runnable runnable = () -> System.out.println(message);
```

- **Non-Capturing lambda**

    외부 변수를 이용하지 않는 람다식을 의미한다.

```java
Runnable runnable = () -> System.out.println("NonCapturingLambda");

Runnable runnable = () -> {
    String message = "NonCapturingLambda";
    System.out.println(message);
}
```

Capturing lambda 는 다시 local capturing lambda 와 non - local capturing lambda 로 구분할 수 있다.  local 과 non - local 로 구분하는 이유는 지역 변수가 가지는 특징으로 인해 내부 동작 방식이 다르기 때문이다.

## Local Capturing lambda

```java
public void testPlusByLocalVariable() {
    int localNumber = 1;
    Addable addableImple = () -> localNumber + 1; 
}
```

외부 변수로 지역 변수를 이용하는 람다식을 의미한다. 다음과 같은 특징이 있다.

1. 람다식에서 사용되는 외부 지역 변수는 **복사본이다**.
2. final 혹은 effectively final 인 지역 변수만 람다식에서 사용할 수 있다.
3. 복사된 지역 변수 값은 람다식 내부에서도 변경할 수 없다. 즉 final 변수로 다뤄야 한다.

각 특징이 생기는 이유를 하나씩 살펴보자.

### 1. 람다식에서 사용되는 외부 지역변수는 **복사본이**다.

람다식에서는 외부 지역변수를 그대로 사용하지 못하고 복사본을 사용하는 이유는 다음과 같다.

- 지역 변수는 스택 영역에 생성된다. 따라서 지역 변수가 선언된 block 이 끝나면 스택에서 제거된다.

    → 메소드 내 지역 변수를 참조하는 람다식을 리턴하는 메소드가 있을 경우, 메소드 block 이 끝나면 지역 변수가 스택에서 제거 되므로 추후에 람다식이 수행될 때 참조할 수 없다.

- 지역 변수를 관리하는 쓰레드와 람다식이 실행되는 쓰레드가 다를 수 있다.

    → 스택은 각 쓰레드의 고유의 공간이고, 쓰레드끼리 공유되지 않기 때문에 마찬가지로 람다식이 수행될 때 값을 참조할 수 없다.

위와 같은 이유로 인해 람다식에서는 외부 지역 변수를 직접 참조하지 않고 복사본을 전달받아 사용하게 된다.

### 2. final 혹은 effectively final 인 지역 변수만 람다식에서 사용할 수 있다.

오늘의 핵심 주제에 드디어 도달했다.

만약 참조하고자 하는 지역 변수가 final 혹은 effectively final 이 아닐 경우 즉, 변경이 가능할 경우 어떤 문제가 발생할 수 있는지 살펴보자.

```java
public void executelocalVariableInMultiThread() {
    boolean shouldRun = true;
    executor.execute(() -> {
        while (shouldRun) {
            // do operation
        }
    });
    
    shouldRun = false;
}
```

람다식이 어떤 쓰레드에서 수행될지는 미리 알 수 없다. 이 얘기는 곧 외부 지역 변수를 다루는 쓰레드와 람다식이 수행되는 쓰레드가 다를 수 있다는 의미이다. 지역 변수 값(shouldRun) 을 제어하는 쓰레드 A, 람다식을 수행되는 쓰레드 B 가 있다고 가정하자. 문제는 다음과 같다.

쓰레드 B의 shouldRun 값이 가장 최신 값으로 복사되어 전달 됐는지 확신할 수 없다는 것이다. **왜냐하면 shouldRun 은 변경이 가능한 지역 변수이고, 지역 변수를 쓰레드 간에 sync 해주는 것은 불가능 하기 때문이다.**   (지역 변수는 쓰레드 A 의 스택 영역에 존재하기 때문에 다른 쓰레드에서 접근이 불가능하다. volatile 과 같은 키워드가 로컬 변수에서 사용될 수 없는 이유도 이와 같다.) 

값이 보장되지 않는다면 매번 다른 결과가 도출 될 수 있다. 예측할 수 없는 코드가 의미가 있을까? 
이러한 이유로 인해 외부 지역 변수는 전달되는 복사본이 변경되지 않은 최신 값 임을 보장하기 위해 fianl 혹은 effectively final 이어야 한다.

### 3. 복사된 지역 변수 값은 람다식 내부에서도 변경할 수 없다. 즉 final 변수로 다뤄야 한다.

처음에는 이미 복사가 된 값이므로 변경해도 문제가 없는 것 아닌가? nope.
복사될 값의 변조를 막아 최신 값임을 보장하기 위해 final 제약을 걸었는데 람다식 내부에서 변경이 가능할 경우 다시 제자리로 돌아오게 된 격이다. 또한 컴파일 된 람다식은 static 메소드 형태로 변경이 되는데, 이때 복사된 값이 파라미터로 전달되므로 마찬가지로 스택영역에 존재하기 때문에 sync 를 해주는 것도 불가능하다. 따라서 람다식 내부에서도 값이 변경 되어서는 안된다.

컴파일러 레벨에서 앞, 뒤로 final 제약을  걸어줌으로써 멀티 쓰레드 환경에서 대응하기 어려운 이슈를 미연에 방지했다.

## Non - local capturing lambda

```java
private int instanceNumber = 1;
private static int staticNumber = 1; 

public void testPlusByInstanceVariable() {
    instanceNumber = 2;
    Addable addableImple = () -> instanceNumber + 1;
}

public void testPlusByStaticVariable() {
    staticNumber = 2;
    Addable addableImple = () -> staticNumber + 1;
}
```

외부 변수로 인스턴스 변수 혹은 클래스 변수를 이용하는 람다식을 의미한다. local capturing lambda 와 다르게 final 제약 조건이 없고, 외부 변수 값도 복사하지 않는다. 

이유는 인스턴스 변수나 클래스 변수를 저장하고 있는 메모리 영역은 공통 영역이고 값이 메모리에서 바로 회수되지 않기 때문에 람다식에서 바로 참조가 가능하다. 따라서 복사 과정이 불필요하고 참조 시 최신 값 임을 보장할 수 있다. 다만 멀티 쓰레드 환경일 경우 volatile, synchronized 등을 이용하여 sync 를 맞춰주는 작업을 잊어서는 안된다.

## 결론

람다식에서 외부 지역 변수를 이용할 경우 final 혹은 effectively final 이어야 하는 이유는 지역 변수가 스택에 저장되기 때문에 람다식에서 값을 바로 참조하는 것에 제약이 있어 복사된 값을 이용하게 되는데, 이때 멀티 쓰레드 환경에서 복사 될/복사된 값이 변경 가능 할 경우 이로 인한 동시성 이슈를 대응할 수 없기 때문이다.

# Reference
[https://www.baeldung.com/java-effectively-final](https://www.baeldung.com/java-effectively-final)
[https://www.baeldung.com/java-lambda-effectively-final-local-variables](https://www.baeldung.com/java-lambda-effectively-final-local-variables)
[https://dzone.com/articles/how-lambdas-and-anonymous-inner-classesaic-work](https://dzone.com/articles/how-lambdas-and-anonymous-inner-classesaic-work)