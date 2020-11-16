---
title: "[안드로이드] 그런 Rx Java 로 괜찮은가  2 - Mulitple API, 병렬 처리 (flatMap, merge, zip)"
date: 2019-08-10 20:37:01
category: "Android"
template: "post"
description: "RxJava 의 큰 장점 중 하나는 무엇이든 Observable 소스로 추상화하고, 이를 제공되는 Operation을 이용하여 손쉽게 가공할 수 있다는 점이다. 안드로이드 개발 중 가장 흔하게 접할 수 있는 케이스로는 Retrofit - RxJava 조합을 이용한 API 통신이 있다."
tags: 
  - 리엑티브 프로그래밍
  - RxJava
  - 병렬 처리
redirect_from:
  - /2019/08/10/is-this-rxjava-2/
---

RxJava 의 큰 장점 중 하나는 무엇이든 Observable 소스로 추상화하고, 이를 제공되는 Operation을 이용하여 손쉽게 가공할 수 있다는 점이다. 안드로이드 개발 중 가장 흔하게 접할 수 있는 케이스로는 Retrofit - RxJava 조합을 이용한 API 통신이 있다. 

기본적인 API 콜 코드
```java
MyService.fetchUserData()
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(user -> updateViewFrom(user));
```

그런데 개발을 진행하다보면, 한번에 다수의 API 를 호출해야 할 상황을 맞이할 때가 있다. 역시 RxJava 에서 제공하는 다음 Operation 들을 활용하면 어려운 일이 아니다. 그러나 여전히 잘못 사용할 수 있는 여지가 존재한다. 기본적인 활용 방법과 주의해야할 점을 알아보자.

# Multiple API call

보통 flatMap, merge, zip 3가지 옵션을 자주 활용하게 된다.

처음에 각 연산자의 역할과 차이점을 명확히 구별하기 어려울 수 있는데, 다음과 같은 예시로 먼저 가볍게 느낌만 알아보자. 

어느 매장에서 치킨과 피자를 주문하였다. 이때 주문 옵션에 flatMap, merge, zip 을 선택할 수 있다.

- **치킨.flatMap(피자)** 옵션을 선택한 경우 : 치킨을 조리하고, 완성된 치킨을 이용하여 피자를 만든 후 피자가 제공된다.
- **merge.(치킨, 피자)** 옵션을 선택한 경우 : 치킨, 피자 중 먼저 음식이 완성된 순서대로 제공된다.
- **zip.(치킨, 피자, 치킨 피자 세트)** 옵션을 선택한 경우 : 치킨, 피자 둘다 음식이 완성되면 치킨 피자 세트가 제공된다.

## 1. API 콜 간에 의존성이 있다 : flatMap

각 API 호출 간에 의존성이 있는 케이스에서는 flatMap 을 활용하자. 예를 들면 첫번째 API 콜을 이용하여 인증 토큰을 얻어 오고, 인증 토큰을 이용하여 두번째 API 콜을 하는 케이스.

**flatMap** 연산자는 특수한 형태의 map 연산자이다. map 의 경우 다른 데이터 타입으로 가공하지만, flatMap 의 경우 **다른 데이터를 발행할 수 있는** **Observable 소스**로 가공한다. 

첫번째 API 를 호출하고, 그 결과를 이용하여 두번째 API 를 호출하는 코드
```java
firstCall()
    .flatMap(firstCallResult -> secondCall(firstCallResult))
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(secondCallResult -> updateResult(secondCallResult))
```

## 2. 각각의 API 결과를 한곳에서 처리하고 싶다 : merge

API 가 서로 의존성이 없고, 각 결과를 하나의 옵저버에서 받고 싶을 경우 merge 를 활용하자.

**merge** 연산자는 여러 개의 Observable 소스에서 발행한 데이터를 모아서(merge) 한곳에서 모두 받을 수 있도록 해준다. 

첫번째 API, 두번째 API 를 각각 호출하고 그 결과를 처리하는 코드
```java
Observable.merge(firstCall(), secondCall())
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(eachResult -> updateResultWithIndividual(eachResult))
```

## 3. 각각의 API 의 결과를 조합하고 싶다 : zip

각각의 API 호출 결과를 모아서 한번에 받고 싶을 경우 zip 을 활용하자.

**zip** 연산자는 여러 개의 Observable 소스에서 발행한 데이터들을 모은 후, **모든 Observable 소스에서 데이터가 발행이 완료 됐을 경우** 모았던 데이터를 결합하여 하나의 데이터 형태로 발행한다. 이때 각 결과를 어떻게 결합 할지에 대한 정의를 해줘야 한다.

첫번째 API, 두번째 API 결과를 합친 결과를 처리하는 코드
```java
Observable.zip(
    	firstCall(), 
    	secondCall(), 
    	(firstResult, secondResult) -> new combinedResult(firstResult, secondResult))
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(combinedResult -> updateResult(combinedResult)
```

## 그외..

위 내용에서는 자주 사용 되는 3개의 연산자만 설명했지만, 그 외에도 여러 특수한 케이스에서 활용할 수 있는 연산자가 많이 있다. 또한 API 호출이 아니라 Observable 소스로 추상화될 수 있는 그 무엇이든 위 연산자 들의 정의대로 활용이 가능하니 한번 익혀두면 두고두고 유용할 것이라 생각된다.

# 정말 효율적인 처리 일까? (Feat. 병렬처리)

이전 글에서도 얘기했지만, RxJava 는 같은 작업을 처리 하더라도 접근할 수 있는 경로가 매우 다양하다. 또한 각 연산자들이 어느정도 추상화되어있는 형태이다 보니 정확히 이해하지 않고 사용할 경우 결과는 그럴듯하나 내부적으로는 비효율적으로 동작할 수 있다.

사실은 위 예시에서도 비효율적으로 동작하는 부분이 존재한다. 다시 zip 을 활용하는 케이스로 돌아가보자. 우리가 zip 을 활용하여 API 콜을 묶을 때 기본적으로 다음과 같이 작동할 것이라고 생각한다.

"두개의 API가 각각 **동시에** 호출되고, 각 결과가 모두 도착하면 하나의 데이터로 발행이 되겠지?" 

그런데 실제 API 콜을 프로파일러로 분석해보면, io 스케줄러 쓰레드에서 **순차적으로** API 를 호출함을 알 수 있다. 즉, 비동기 처리는 되었지만 **병렬로 동작하지 않게 된다.**

## 비 효율적인 방법 (병렬처리 X)
```java
Observable.zip(
    	firstCall(), 
    	secondCall(), 
    	(firstResult, secondResult) -> new combinedResult(firstResult, secondResult))
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(combinedResult -> updateResult(combinedResult)
```

다음 코드를 보고 이런 궁금증이 생길 수 있다.

'subscribeOn 에 io 스캐쥴러를 설정해줬으니, 가장 처음 수행되는 zip 이 io 쓰레드에서 동작하는거 아닌가?'

맞다. zip 연산 자체는 io 쓰레드에서 수행된다. 하지만 zip 의 정의를 다시 한번 생각해보자. zip 은 단지 2개 혹은 그 이상의 Observable 소스가 발행하는 데이터를 묶어서 하나의 데이터로 발행하는 역할을 수행할 뿐이지, **개별 Observable 소스의 아이템이 발행되는 쓰레드는 관여하지 않는다.**  따라서 zip 연산자는 ios 쓰레드에서 **순차적으로** Observable 소스를 발행 했던 것이다.

## 효율적인 방법 (병렬처리 O)

개별 Observable 소스가 각각 다른 쓰레드에서 아이템이 발행 되길 원할 경우 다음과 같이 소스에 스케쥴러를 각각 설정 해줘야한다.
```java
Observable.zip(
    	firstCall().subscribeOn(Schedulers.io()), 
    	secondCall().subscribeOn(Schedulers.io()), 
    	(firstResult, secondResult) -> new combinedResult(firstResult, secondResult))
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(combinedResult -> updateResult(combinedResult)
```

또한 zip 연산에 대한 스케쥴러 설정이 사라졌는데, 사실 zip 연산 자체가 별도의 쓰레드에서 수행될 이유는 없기 때문이다. 

zip 연산외에 merge 에서도 위 내용은 동일하게 적용되니 개발시 참고하자!

# 맺으며

RxJava 는 강력한 도구이지만 그만큼 숙지해야할 내부 정책들도 제법 많다. 이러한 정책들, 낯선 접근방식 때문에 여전히 러닝커브가 높다고 여겨지지만 한번 적응하면 이만한 도구가 없다고 느껴지는 것도 사실이다. 잘 흡수하여 무기로 갈고 닦는다면 개발시 직면하는 다양한 문제들을 해결해줄 것이라고 생각한다. 🤟
