---
title: "[Android] Process 재시작 과 Fragment 생명 주기"
date: 2020-02-23 20:33:03
category: "android"
template: "post"
description: "최근에도 큰 규모의 리펙토링을 진행했는데, Fragment 생명주기에 대한 지식이 부족하여 많은 이슈를 발생시켰다. 😭 이번 포스팅에서는 해당 이슈의 원인과 해결법에 대해 적어보려 한다."
tags: 
    - Fragment
---
![cover](/media/cover/bike_cover.jpg)

최근에도 큰 규모의 리펙토링을 진행했는데, Fragment 생명주기에 대한 지식이 부족하여 많은 이슈를 발생시켰다. 😭 이번 포스팅에서는 해당 이슈의 원인과 해결법에 대해 적어보려 한다.

# TL;DR

- 프로세스가 재 시작 될 때 Activity, Fragment 의 생명 주기 흐름이 조금 다르게 진행된다.
- Fragment 에서 Activity 의 데이터를 참조할 때는 onActivityCreated 메소드 내에서 진행하자.

# 프로세스, Activity, Fragment 의 생명주기

안드로이드의 독특한 특징 중 하나는 프로세스 생명 주기와 어플리케이션 생명 주기와 항상 동일하지 않다는 점이다. 앱이 실행되고 있어도 프로세스를 죽일 수 있고 반대로, 앱을 종료해도 프로세스가 바로 종료되는 것은 아니다.

대표적으로 시스템이 프로세스를 죽이는 경우는 다음과 같다.

- 메모리가 부족할 경우 시스템은 우선순위가 낮은 프로세스를 죽인다.
- 앱이 일정 기간 이상 백그라운드 상태에 있을 경우 시스템은 해당 앱의 프로세스를 죽인다.
- 앱이 허용했던 권한을 해제 시 시스템은 해당 앱의 프로세스를 죽인다.

하지만 이렇게 앱과 프로세스의 수명 주기가 일치하지 않을 경우 유저는 영문도 모른채 간헐적으로 처음부터 재시작하는 앱을 경험하게 될 것이다. 이에 onSaveInstance 메소드를 제공하여 데이터를 백업하고 사용하여 사용자에게 영향을 주지 않도록 설계되어 있다.

문제는 이렇게 '시스템이 프로세스를 죽이고, 해당 프로세스가 재시작 됐을 경우' Activity 와 Fragment 의 생명주기 흐름이 일반적인 상황과는 조금 다르게 진행된다.

# 일반적인 상황에서 생명 주기 흐름

사용자가 처음 앱을 구동하는 상황으로 가정한다.
```java
// MainActivity.class
@Override
protected void onCreate(Bundle savedInstanceState) {
    Log.e("lifeCycle", "Activity onCreate");
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    // initialize ...

    addFragment();
}
```

위와 같이 onCreate 메소드 에서 Fragment 를 초기화 해준다고 했을 때, LifeCycle 은 다음과 같은 순서로 진행된다.
```
    E/lifeCycle: Activity onCreate
    E/lifeCycle: Fragment onAttach
    E/lifeCycle: Fragment onCreate
    E/lifeCycle: Fragment onCreateView
    E/lifeCycle: Fragment onActivityCreated
```
# 시스템에 의해 kill 된 프로세스가 재 시작 될 때, 생명 주기 흐름

좀 더 자세한 흐름을 보기 위해 로그를 아래와 같이 세분화 하였다. 그 외에 변경사항은 없다.
```java
// MainActivity.class
@Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.e("lifeCycle", "Activity onCreate : before super.onCreate");
        super.onCreate(savedInstanceState);
        Log.e("lifeCycle", "Activity onCreate : after super.onCreate");
        
        setContentView(R.layout.activity_main);

        addFragment();
    }
```

시스템에 의해 kill 된 프로세스를 재 시작 했을 때 LifeCycle 은 다음과 같은 순서로 진행된다.
```
    E/lifeCycle: Activity onCreate : before super.onCreate
    E/lifeCycle: Fragment onAttach
    E/lifeCycle: Fragment onCreate
    E/lifeCycle: Activity onCreate : after super.onCreate
    E/lifeCycle: Fragment onCreateView
    E/lifeCycle: Fragment onActivityCreated
```

....!!!

일반적인 상황일 때의 흐름과 큰 차이점이 있다. 

1. base Activity 에서 Fragment 를 복구한다.
2. Fragment 복구가 완료되면 supre.onCreate() 다음 라인으로 흐름이 반환되어 나머지 로직이 진행된다.

몇 번을 반복 해봐도 흐름 순서가 동일한 것으로 보아 비동기로 진행되는 것은 아닌 것으로 추측된다.

# 발생할 수 있는 문제

위와 같은 차이점은 Fragment 의 onCreate 메소드 내에서 Activity 의 데이터를 참조할 경우 문제가 발생할 수 있다. 

Activity 의 여러 initialize 작업이 진행되기 전에 Fragment 의 onCreate 가 불리기 때문에 존재하지 않는 데이터를 참조하여 NPE 가 발생하게 된다. 내가 겪었던 문제도 정확히 이와 같은 케이스였다.
```java
// MainActivity.class
@Override
protected void onCreate(Bundle savedInstanceState) {
    Log.e("lifeCycle", "Activity onCreate : before super.onCreate");
    // --> Restore Fragment !!!! : called onAttach(), onCreate()
    super.onCreate(savedInstanceState);
    Log.e("lifeCycle", "Activity onCreate : after super.onCreate");

    setContentView(R.layout.activity_main);

    addFragment();
}
```

# 해결책

1. super.onCreate(savedInstanceState) 가 호출되기 전에 initialize 를 진행한다.

    → 추천하지 않는다. 오히려 하위 Activity 가 초기화되지 않았을 때 발생하는 사이드 이펙트가 더 많을 수 있다.

2. **onActivityCreated()** 메소드 내에서 Activity 레벨의 변수를 참조한다.

    → 구글에서 권장하는 방법이며, 애초에 이 메소드의 존재 이유라고 생각한다.

    > Called when the fragment's activity has been created and this fragment's view hierarchy instantiated. It can be used to do final initialization once these pieces are in place, such as retrieving views or restoring state.

    사실 해당 내용을 공부하기 전까지는 이 메소드의 필요성을 잘 느끼지 못했다. 어차피 onCreate() 나 onActivityCreated() 나 Activity 의 onCreate() 가 끝나고 불리는 것은 동일하다고 생각했기 때문이다. 

    하지만 onCreate() 는 **Fragment 의 생성**을 알려줄 뿐 Activity 와 직접적인 연관은 없다. 

    docs 에서도 이 사실을 친절히 짚어주고 있다.

    > Note that this can be called while the fragment's activity is still in the process of being created. As such, you can not rely on things like the activity's content view hierarchy being initialized at this point. If you want to do work once the activity itself is created, see onActivityCreated(android.os.Bundle)

    사실상 오늘 내용의 핵심이 모두 담겨있다...

# 결론 - 공식 docs 가 먼저다.

항상 넘겨짚는 순간에 실수가 발생한다. 스스로 정확하게 설명할 수 없다면 다시 공부하는 수 밖에 없다.

그리고 위 내용을 찾아보면서 파편화된 정보나 내용의 불일치로 인해 적지않은 시간을 소비했는데 공식 docs 에서 너무 깔끔히 설명하고 있어 허탈함을 조금 느꼈다. 역시 공식 docs 먼저! 😹