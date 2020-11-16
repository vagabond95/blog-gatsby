---
title: "[안드로이드] 그런 Rx Java 로 괜찮은가  1 - subscribeOn, observeOn"
date: 2019-07-20 23:13:09
category: "Android"
template: "post"
description: "구글은 점점 더 안드로이드 아키텍처를 리엑티브하게 구조화 하려는 움직임을 보이고 있고, Databinding, LiveData 그리고 RxJava 는 그러한 구조화 작업의 핵심 토대를 담당하고 있다. 또한 주력으로 사용되는 Retroift 부터 AAC 의 Room, Paging 에 이르기까지 많은 안드로이드 라이브러리가 RxJava 를 지원하고 있다."
tags: 
  - 리엑티브 프로그래밍
  - RxJava
redirect_from:
  - /2019/07/20/is-this-rxjava-1/
---

구글은 점점 더 안드로이드 아키텍처를 리엑티브하게 구조화 하려는 움직임을 보이고 있고, Databinding, LiveData 그리고 RxJava 는 그러한 구조화 작업의 핵심 토대를 담당하고 있다. 또한 주력으로 사용되는 Retroift 부터 AAC 의 Room, Paging 에 이르기까지 많은 안드로이드 라이브러리가 RxJava 를 지원하고 있다. 

시대의 흐름에 따라 이제는 거의 필수가 되어버린 RxJava 이기에 더이상 미루지 못하고 활용 방법을 익히기 시작했으나 워낙 제공되는 operation 이 많고 사람들이 사용하는 스타일도 제각각 달라서 스스로 사용법을 익히기까지 많은 시행착오를 겪어야 했다. 위 시리즈는 그동안 RxJava 를 사용하면서 겪었던 경험을 바탕으로 놓치기 쉽거나, 활용했을 때 좋았던 방식들을 적어 나가는 포스트가 될 것 같다. 깊은 수준의 내용은 아니지만, 이 글들을 통해 조금이나마 삽질의 시간을 줄이고 적절하게 RxJava 를 활용하는데 도움이 되었으면 좋겠다. 

# subscribeOn, observeOn 잘 사용하고 있나?
## Schedular 퀴즈 
```java
// # 1
myService.getUsers()
    .subscribeOn(Schedulers.io())
    .observeOn(AndroidSchedulers.mainThread())
    .flatMap(Observable::fromIterable)
    .filter(User::isMember)
    .map(this::saveToCache)
    .toList()
    .subscribe(View::showUser);
    
    
// # 2
myService.getUsers()
    .subscribeOn(Schedulers.io())
    .flatMap(Observable::fromIterable)
    .filter(User::isMember)
    .map(this::saveToCache)
    .toList()
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(View::showUser);
```

위 두 케이스는 user 리스트를 요청하는 API 를 호출한 후 필요한 비즈니스 로직을 수행하는 코드이다.

각 케이스의 차이점은 observerOn, subscribeOn 의 호출 순서가 다르다는 점이다. 2개의 코드에서 각각의 스트림 연산이 어느 쓰레드에서 수행되는지 잠시 예상해보자. 

만약 정확히 얘기할 수 있다면 이미 subscribeOn, observeOn 에 대한 이해가 충분할 것이라 예상되어 해당 글은 리마인드 차원에서 가볍게 보고 넘어가면 될 것 같다. 👏
  
  
위 문제의 답은 다음과 같다.
첫번째 케이스는 getUsers() 에 대한 연산만 io Schedular 쓰레드 위에서 수행되며, **나머지 모든 하위 스트림 연산은 메인쓰레드에서 수행된다.**
두번째 케이스는 getUsers() ~ toList 연산까지 io Schedular 위에서 수행되며, subscribe 내에서 콜백으로 **최종 데이터를 전달받는 연산만 메인쓰레드에서 수행된다**.

따라서 첫번째 케이스는 굳이 메인 쓰레드에서 수행하지 않아도 될 비즈니스 로직을 수행하고 있는 것 이므로 **자원의 낭비가 있는 코드**라고 볼 수 있다. (만약 엄청나게 많은 리소스가 요구되는 비즈니스 로직이라면...😭)

## 정의와 올바른 활용법
사실 각 케이스에서 subscribeOn 은 어느 순서에 호출하든 결과는 변하지 않는다. 위 결과의 차이를 만드는 것은 **observeOn 의 호출 위치**이다. 
호출위치라고? subscribeOn, observeOn 의 정의를 한번 살펴보자.

> subscribeOn 
- observable source 가 observer 에 의해 **subscribe 됐을 때, source 가 데이터를 다음 스트림으로 전달하는 액션**을 수행하는 스케쥴러를 지정.

> observeOn 
- **observerOn 이후 수행되는 스트림의 액션**을 수행하는 스케쥴러를 지정

간단히 얘기하면 
- subscribeOn 는 [첫번째 스트림 ~ observeOn 호출 전 까지의 스트림] 의 쓰레드를 지정 
- observeOn 은 [해당 observeOn 호출 이후의 스트림] 의 쓰레드를 지정한다.

위 정의에 따르면 observeOn 은 **어느 순서에 호출되느냐에 따라** 영향을 받는 스트림이 달라지게 된다. 따라서 첫번째 케이스는 getUsers() 이후 바로 observeOn 이 호출 됐으므로 이후 스트림의 연산이 메인쓰레드에서 수행되게 되는 것이다.

만약 이러한 특성을 고려하지 않고 기계적으로 코드를 작성하게 될 경우, 첫번째 케이스 처럼 작성하게 될 가능성이 있고 이는 RxJava 가 의도한 특성을 제대로 활용하지 못하고 있는 것이라고 볼 수 있다. (내가 그랬다..)

위 정의와 본래 의도에 맞게 다시 코드를 작성하면 아래와 같다.
```java
myService.getUsers()
    .subscribeOn(Schedulers.io())
    .observeOn(Schedulers.computation()) 
    .flatMap(Observable::fromIterable)
    .filter(User::isMember)
    .map(this::saveToCache)
    .toList()
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe(View::showUser);
```

* computation 쓰레드로 바꾸지 않고, io 쓰레드 위에서 그대로 진행되어도 상관은 없으나, 각 schedualars 가 본래 역할에 맞게 사용될 수 있도록 하기위해 바꾸었다.

## 그외 subscribeOn, observeOn 활용시 도움이 될만한 사실들 
- subscribeOn, observeOn 호출은 필수가 아닌 옵션이다.
- subscribeOn, observeOn 모두 호출하지 않았을 경우 subscribe() 를 호출한 thread 에서 스트림연산이 수행된다. (일반적으로는 메인쓰레드 일 것이다.)
- subscribeOn 은 최초 1회 호출만 적용되며, 그 이후 다시 호출하는 것은 무시된다.
- observeOn 은 호출 횟수에 제한이 없다.
- subscribeOn 만 호출할 수 있다. 따라서 subscribeOn 정의에 따라 모든 스트림 연산은 subscribeOn 에서 지정한 쓰레드 위에서 수행된다.
    - observeOn(AndroidSchedulars.mainThread()) 를 기계적으로 호출하지 말자. 백그라운드 상에서 수행될 작업만 있는 스트림일 경우 subscribeOn(Schedulars.xx) 호출만으로 충분하다.
- observeOn 만 호출할 수 있다. (하지만 활용한 케이스 X)
- subscribeOn 의 호출 순서는 결과에 영향을 주지 않지만, 되도록 첫번째 혹은 마지막에 호출하는 것이 가독성 측면에서 좋다고 느낀다. 특히 메소드 체이닝이 길어질 수록 더더욱 흐름 파악에 도움이 된다.

# 결론

**subscribeOn / observeOn 를 상황에 맞게 활용하고, 특히 observeOn 은 호출 순서에 주의하자.**