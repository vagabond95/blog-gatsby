---
title: IoC, DI, DIP 개념 잡기
date: 2020-07-03 02:08:49
category: "이론"
template: "post"
description: "IoC, DIP, DI 는 항상 혼동되는 개념이다."
tags: 
    - DI
    - IoC
    - DIP
    - 의존성
---
IoC, DIP, DI 는 항상 혼동되는 개념이다. 각 개념을 서로 같다고 표현하는 글들도 제법 있고, 각 개념의 정의를 살펴보니 직관적으로 이해가 되지 않았다. 요즘 특히 DI 에 대한 내용이 많이 언급되고 있다고 느끼는데 정작 주장하는 문맥이 조금씩 다르다보니 스스로 답답함을 느꼈다. 제대로된 논의를 하기 위해서는 올바른 개념 정리가 필요하다고 생각되어 각 개념에 대한 정보를 모으고 정리했다. 

# 무엇이 다를까?

> To be sure, using DI or IoC with DIP tends to be more expressive, powerful and domain-aligned, but they are about different dimensions, or forces, in an overall problem. DI is about wiring, IoC is about direction, and DIP is about shape.

결론부터 얘기하면 IoC, DIP, DI 는 모두 다른 개념이다. 각자 목적과 요구하는 바가 다르다. 하지만 서로를 배척하는 개념은 아니다. 오히려 함께 했을 때 강한 시너지가 생긴다.

# Inversion of Control (IoC, 제어의 역전)

> don't call me, I'll call you. - [Hollywood principle](https://en.wiktionary.org/wiki/Hollywood_principle)

개인적으로 IoC 를 가장 직관적으로 잘 설명한 문장이라고 생각한다.

좀 더 개발 친화적인 용어로 풀어서 설명하면 다음과 같이 표현할 수 있다. 

> IoC 란 코드의 흐름을 제어하는 주체가 바뀌는 것이다.

코드의 흐름을 제어한다는 것은 여러 행위를 포함한다. 오브젝트를 생성하는 것, 오브젝트의 생명주기를 관리하는 것, 메소드를 수행하는 것 등. 그리고 일반적인 프로그램은 이러한 행위를 하나부터 열까지 모두 스스로 수행한다. (우리가 처음 만들었던 프로그램을 잘 생각해보자.) IoC 를 적용한다는 것은 이러한 흐름 제어를 또다른 제 3자가 수행한다는 것을 의미한다.

안드로이드에서도 IoC 가 적용된 케이스를 볼 수 있다.

```java
public class MyActivity extends AppCompatActivity {

    @Override
    protected void onResume() {
        super.onResume();
        // do something
    }

    @Override
    protected void onPause() {
        // do something
        super.onPause();
    }
}
```

우리가 Activity 코드를 작성할 때 생명주기 메소드가 호출되었을 때의 동작만 정의하고, **언제 생명주기 메소드를 호출 할지는 신경쓰지 않는다**. 즉, Activity 의 메인 흐름 제어권은 나의 코드가 아니라 안드로이드 플랫폼에서 쥐고 있다.

누가 물어봤을 때 명확한 답변을 못했던 '프레임 워크와 라이브러리의 차이는 무엇인가?' 에 대해 IoC 관점으로 설명이 가능하다. 라이브러리는 내 코드가 라이브러리를 이용한다. 즉, 제어권이 내 코드에 있다. 반면 프레임 워크는 프레임 워크가 나의 코드를 실행한다. 즉, 제어권은 프레임워크에게 있다.

> Software frameworks, callbacks, schedulers, event loops, dependency injection, and the template method are examples of design patterns that follow the inversion of control principle

IoC 를 따르는 개념이 생각보다 많았다.

# Dependency Inversion principle (DIP, 의존관계 역전 법칙)

> a.  High-level modules should not depend on low-level modules. Both should depend on abstractions (e.g. interfaces).
b. Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions.

SOLID 원칙 중 하나이다. 의존관계에 대해 다루고 있는데 한번에 바로 이해될 수 있는 설명이 아니었다. 관련된 내용을 찾아보다가 좀 더 직관적으로 표현된 문장을 발견했다.

> DIP is about the level of the abstraction in the messages sent from your code to the thing it is calling

DIP 가 주장하는 바의 핵심은 추상화에 의존하라는 것이다. 

추상화가 아닌 구체클래스에 의존한 경우를 살펴보자.

```java
public class FileLoader {
private TextFileParser textFileParser;

    public FileLoader() {
        // TextFile 이 아닌 csv 파일을 파싱해야할 경우 필연적으로 코드의 변경이 발생
        this.textFileParser = new TextFileParser();
    }

    public File parseFile(String serializedFile) {
        return textFileParser.parse(serializedFile);
    }
}
```

위와 같이 TextFileParser 에 변경이 발생했을 때 이를 의존하는 FileLoader 역시 변경이 발생하게 된다. 또한 FileLoader 는 TextFile 외에 다른 File 을 파싱하기 위해서는 아예 Parser 클래스를 변경해야한다. 변경에 유연하지 않은 구조이다.

추상화에 의존할 경우를 살펴보자

```java
public interface FileParser {
    File parse(String serializedFile);
}

public class TextFileParser implements FileParser {

    @override
    public File parse(String serializedFile) {
        // Do something
        return File();
    }
}

public class FileLoader {
    private FileParser fileParser;

    public FileLoader(FileParser fileParser) {
        this.fileParser = fileParser;
    }

    public File parseFile(String serializedFile) {
        return fileParser.parse(serializedFile);
    }
}
```

FileLoader 는 FileParser 인터페이스에 의존하기에 FileParser 의 구현체인 TextFileParser 변경이 발생하더라도 영향을 받지 않는다. 또한 FileParser 인터페이스를 구현한 구현체라면 무엇이든 FileLoader 에서 이용이 가능하다. 즉, 다형성을 활용하여 변경에 유연한 구조가 된다. 

# Dependency Injection (DI, 의존성 주입)

> DI is about how one object acquires a dependency

DI 는 필요로 하는 오브젝트를 스스로 생성하는 것이 아닌 외부로 부터 주입받는 기법을 의미한다. 마틴 파울러의 글에 따르면 3가지 타입으로 정의할 수 있다.

## Constructor Injection

생성자를 통해 주입하는 방식이다. 인스턴스가 생성되었을 때 의존성이 존재하는 것이 보장되기 때문에 의존성의 존재여부가 보장되고 의존성을 immutable 하게 정의할 수 있다. [스프링](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-setter-injection)에서도 해당 방식을 권장하는 것으로 알고 있다.

```java
public class FileLoader {
    private FileParser fileParser;

    public FIilLoader(FileParser fileParser) {
        this.fileParser = fileParser;
    }
}
```

## Setter Injection

Setter 메소드를 이용하여 주입하는 방식이다. 해당 방식은 Construcor Injection 보다 좀 더 주의를 요한다. 주입 받는 의존성의 기본값을 정의할 수 있지 않다면 null 값이 존재할 수 있는 이슈가 있기 때문이다. 의존성이 다시 주입되어야할 경우 유용하게 사용된다고 하나 나는 아직 그러한 상황을 겪지 못했고 모두 Construcor Injection 으로 해결할 수 있었다.
 

```java
public class FileLoader {
    private FileParser fileParser;

    public void setFIilLoader(FileParser fileParser) {
        this.fileParser = fileParser;
    }
}
```

## Interface Injection

Interface 로 주입받는 메소드를 정의한다. 이 방식은 이번에 조사하면서 처음 알게 되었고 실제로 사용해본 적이 없어 자세히 적기는 조심스럽다. 예시를 봐도 이점이 명확하게 보이지 않아 좀 더 공부를 하고 내용을 채워보려 한다.

# 각 개념 간의 관계

## IoC 와 DI

종종 IoC 와 Dependency Injection 은 서로 interchangeably 한 것, 더 나아가 아예 같은 것처럼 표현하는 글이 보이곤 하는데 이는 잘못된 해석이라고 생각한다. Dependency Injection 은 IoC 개념이 적용된 결과물 중 하나일 뿐이다. 의존성을 주입한다는 것을 IoC 적인 행위로 바라볼 수 는 있지만 IoC 가 곧 의존성 주입이라고 보기 는 어렵기 때문이다.

## DIP 와 DI

단어가 비슷해보이는 DIP 와 DI 역시 같은 개념으로 오해하기 쉽다. 하지만 마찬가지로 DI 는 DIP 를 구현하는 기법중 하나일 뿐 서로 같은 개념이 아니다. 위 DIP 예제 코드에서도 DI 가 이용되었다.

DIP 에 대한 이해가 부족했을 때, 아래와 같은 코드도 DIP 를 만족하는 것이라고 생각했었다.

```java
public interface FileParser {
    File parse(String serializedFile);
}

public class TextFileParser implements FileParser {

    @override
    public File parse(String serializedFile) {
        // Do something
        return File();
    }
}

public class FileLoader {
    private FileParser fileParser;

    public FileLoader() {
        this.fileParser = new TextFileParser();
    }

    public File parseFile(String serializedFile) {
        return fileParser.parse(serializedFile);
    }
}
```

하지만 해당 코드에서는 FileParser 를 다른 구현체로 바꿀 수 없다. 사실상 타입만 인터페이스로 했을 뿐 다형성의 이점을 전혀 살리지 못하는 코드이며 DIP 를 만족한다고 보기 어렵다.

또 다른 예시를 살펴보자. 이 코드도 조금 아쉬운 점이 있다.

```java
public class FileLoader {
    private TextFileParser textFileParser;

    public FileLoader(TextFileParser textFileParser) {
        this.textFileParser = textFileParser;
    }

    public File parseFile(String serializedFile) {
        return textFileParser.parse(serializedFile);
    }
}
```

해당 코드는 TextFileParser 를 주입 받으므로 DI 가 이루어졌다고 볼 수 있다. 따라서 TextFileParser 의 생성자에 변경이 생기더라도 FileLoader 에 전파되지 않는 것은 긍정적인 부분이다. 하지만 DIP 는 지켜지지 않았다. 구체 클래스에 의존하고 있으므로 다른 FileParser 로 교체하는 것은 불가능하며 TextFileParser 의 변경에 FileLoader 가 영향을 받게 된다.

위 예시들이 시사하는 바는 **DIP 와 DI 는 서로 조합되었을 때 시너지를 발휘한다는 것**이다. 그래서 보통 한쪽 개념의 예시를 들 때 다른 쪽 개념이 같이 적용되어 있기 때문에 두 개념을 같다고 이해 할 법도 하다.

# 개념의 본질을 이해, 착각하지 말기

이러한 개념들을 정리하고 나면 내가 좀 더 개발을 잘하게 되었다는 착각에 종종 빠지곤 한다. 개념은 개념일 뿐이다. 커뮤니케이션 과정에서 리소스를 줄여주고 코드 그것이 곧 개발력과는 연결되지 않는 다고 본다. 중요한 것은 각 개념 속에서 추구하는 본질이 무엇인지 깨닫는 것이다. 

한편으로는 이러한 개념들에 대해 정확히 정리하고 이해하는 과정은 꼭 필요하다. 내가 당장 이러한 것들을 지키지 못하더라도 어떤것이 충족되지 않는지 인식하고, 고쳐나갈 수 있는 기준을 세울 수 있기 때문이다. 무엇을 모르는지 모르는 것과 무엇을 모르는지 아는 것의 차이는 매우 크다.

# Reference

[https://justhackem.wordpress.com/2016/05/14/inversion-of-control/](https://justhackem.wordpress.com/2016/05/14/inversion-of-control/)

[https://www.martinfowler.com/articles/injection.html](https://www.martinfowler.com/articles/injection.html)

[https://martinfowler.com/articles/dipInTheWild.html](https://martinfowler.com/articles/dipInTheWild.html)

[https://dzone.com/articles/ioc-vs-di](https://dzone.com/articles/ioc-vs-di)

[https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans)

[https://www.codeproject.com/Articles/592372/Dependency-Injection-DI-vs-Inversion-of-Control-IO](https://www.codeproject.com/Articles/592372/Dependency-Injection-DI-vs-Inversion-of-Control-IO)

[https://medium.com/@ivorobioff/dependency-injection-vs-service-locator-2bb8484c2e20](https://medium.com/@ivorobioff/dependency-injection-vs-service-locator-2bb8484c2e20)