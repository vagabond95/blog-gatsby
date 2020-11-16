---
title: "[안드로이드] MVVM 과 LiveData 조합 시 겪을 수 있는 이슈와 해결책"
date: 2020-03-13 22:08:20
category: "android"
template: "post"
description: "이번 포스트에서는 MVVM 아키텍처에서 LiveData 를 사용하면서 겪었던 어려움과 여러 해결방법에 대해 적어보려한다."
tags: 
    - 리엑티브 프로그래밍
    - MVVM
---
![cover](/media/cover/live_data_with_event_cover.jpg)
이번 포스트에서는 MVVM 아키텍처에서 LiveData 를 사용하면서 겪었던 어려움과 여러 해결방법에 대해 적어보려한다. MVVM 에 대한 좋은 글은 이미 많이 있으므로 해당 포스트에서는 생략하고 넘어간다! 

# TL;DR

- LiveData 는 이벤트 전달에 적합하지 않다. 약간의 변형이 필요하다.

# 데이터와 이벤트 흐름

MVVM 구조내에서 개발을 할 때, ViewModel → View 의 흐름을 다음과 같이 2가지로 나누어 다루고 있다. 일반적인 정의는 아닐 수 있으나, 해당 글에서 전개될 내용의 핵심이므로 잘 이해하고 가는 것이 중요하다.

## 데이터

데이터는 보통 모델로부터 가공되거나 유저의 액션에 의해 얻어진 특정한 값으로 이루어진다. ObservableField 나 LiveData 형태로 래핑되어 제공되며 **데이터 바인딩**을 이용하여 View (XML) 에게 변경 사항이 전달된다. 대표적으로 다음과 같은 케이스가 있다.

- model 로 부터 가공된 list
- visibility
- 도메인과 관련된 flag 값

```xml
<android.support.v7.widget.RecyclerView
    android:id="@+id/recyclerView"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1"
    android:visibility="@{viewModel.temporaryArticles.size() > 0 ? View.VISIBLE : View.GONE}"
    bind:bindData="@{viewModel.temporaryArticles}" />
```

## 이벤트

이벤트는 databinding 을 통해 수행할 수 없는 작업 즉, Activity/Fragment 레벨에서만 처리할 수 작업들로 구성된다. 이 부분은 자유도가 높지만 보통 RxJava/LiveData 를 이용하여 제공하며 Activity/Fragment 에서 이를 소비한다.  대표적으로 다음과 같은 케이스가 있다.

- Activity action - startActivity(), finish()
- Dialog
- Permission

```java
mViewModel.finishEvent.observe(this, aVoid -> finish())
```

# LiveData 의 한계와 대안점

앞서 언급했듯이 이벤트를 전달하는 것은 구현 자유도가 높은 편이다. 

RxJava 를 이용해도 되고, LiveData 혹은 Custom 하게 Obeserver 패턴 구현체를 써도 상관 없다.  하지만 RxJava 나 Custom Observer 를 구현하면 라이프사이클을 계속 신경써줄수 밖에 없기 때문에 보통은 LiveData 를 선택한다. 

그래도 애매할 때는 여러 레퍼런스를 참고해보며 힌트를 얻어보자. 구글에서 운영하고 있는 공식 repo 인 [Goolge IO app](https://github.com/google/iosched) 과 [Architecture Sample](https://github.com/android/architecture-samples) 를 살펴보자.

## 변형된 형태의 LiveData

각 repo 는 LiveData 를 이용하여 아래와 같이 이벤트 흐름을 처리하고 있다.
```java
// Google IO repo
private val _navigateToSignInDialogAction = MutableLiveData<Event<Unit>>()
val navigateToSignInDialogAction: LiveData<Event<Unit>>
    get() = _navigateToSignInDialogAction

private val _navigateToSignOutDialogAction = MutableLiveData<Event<Unit>>()
val navigateToSignOutDialogAction: LiveData<Event<Unit>>
    get() = _navigateToSignOutDialogAction

// Artictecture sample repo
private final SingleLiveEvent<Void> mEditTaskCommand = new SingleLiveEvent<>();
```

그런데 자세히 보니 LiveData 를 그대로 쓰지 않고 변형된 형태로 쓰고 있다. IO 의 경우 데이터를 Event 로 한번 더 래핑하였고, sample 에서는 아예 새로운 구현체를 만들어 사용하고 있었다.

각 구현체의 내부를 좀 더 살펴보자.
```java
// SingleLiveEvent.java
super.observe(owner, new Observer<T>() {
            @Override
            public void onChanged(@Nullable T t) {
                if (mPending.compareAndSet(true, false)) {
                    observer.onChanged(t);
                }
            }
        });
    
// Event.kt
override fun onChanged(event: Event<T>?) {
        event?.getContentIfNotHandled()?.let { value ->
            onEventUnhandledContent(value)
        }
    }
```
각 구현체의 구조는 거의 유사한데 다음과 같은 특징을 가지고 있다.

1. LiveData 에 등록되는 Observer 를 한번 더 래핑한다.
2. 래핑된 Observer 는 **onChanged 콜백이 여러번 호출되는 것을 막는다.**

구글은 왜 이러한 처리를 거쳐서 LiveData 를 사용했을까? 이유는 LiveData 내부 구조에 있다.

## LiveData 는 데이터를 위해 만들어 졌다.

[docs](https://developer.android.com/topic/libraries/architecture/livedata?hl=en) 에서는 LiveData 를 다음과 같이 정의하고 있다.

> LiveData is an observable data holder class

즉, **LiveData 는 애초에 데이터의 전달을 위해 설계됐다는 얘기다.** 다만, 리엑티브한 개념에서 데이터를 좀 더 추상적으로 생각한다면 이벤트 소스도 하나의 데이터로 생각할 수 있기에 이벤트 전달에 활용을 해도 어색하지는 않다. 다만 구조상 그대로 이벤트를 위해 사용하기에는 한계가 있어 위와 같은 변형 구조로 사용하게 되는 것이다.

여기서 LiveData 의 모든 코드를 다 확인하고 가기는 어려우므로 핵심적인 부분만 살펴보자.
```java
@Override
boolean shouldBeActive() {
    return mOwner.getLifecycle().getCurrentState().isAtLeast(STARTED);
}
    
@Override
public void onStateChanged(LifecycleOwner source, Lifecycle.Event event) {
    if (mOwner.getLifecycle().getCurrentState() == DESTROYED) {
        removeObserver(mObserver);
        return;
    }
    activeStateChanged(shouldBeActive());
}
```

LiveData 는 N 개의 옵저버가 등록될 수 있고,  각 옵저버는 메모리 관리를 위해 active 라는 상태를 가지고 있다. 해당 코드를 잘보면 생명주기가 바뀔 때마다 옵저버의 active 상태를 체크하며, 생명주기가 onStart 이후이면 옵저버가 active 될 수 있다고 판단한다.

그리고 **옵저버는 inactive → active 로 상태가 바뀌면, LiveData 데이터를 소유하고 있을 경우 이를 콜백으로 전달받는다.**

이러한 구조가 이벤트를 전달할 때 왜 문제가 될 수 있을까? 예시 상황을 가정해보자.
```java
// MainViewModel.java
LiveData<String> mShowLoginEvent = new MutableLiveData<>();
    
// MainActivity.java
mViewModel.getShowLoginEvent.observe(this, this::showLoginDialog)
```

ViewModel 은 AAC ViewModel 을 상속 받은 것으로 가정한다.

1. ViewModel 은 로그인 API 를 수행하고, 성공 시 다이얼로그를 띄우는 이벤트를 정의
2. MainActivity 가 onCreate 에서 이벤트를 구독
3. 유저 액션으로 로그인 요청 → 로그인 수행 → 성공 → 다이얼로그 노출까지 문제 없음
4. 화면이 회전됨
5. ViewModel 은 그대로 살아아있음.
6. Activity 가 다시 onCreate 에서 이벤트를 구독
7. onStart 가 됐을 때, **구독한 옵저버는 inactive → active 가 되었고 이전에 발행한 로그인 이벤트 데이터가 남아있으므로 콜백이 호출되어 로그인 다이얼로그가 다시 노출 됨**

이런 케이스도 있을 수 있다. 동일한 AAC ViewModel 을 이용하여 Activity ↔ Fragment 통신을 수행하며 Activity 에 N 개의 Fragment 가 있다면 한번 발행된 이벤트는 이후에 명시적으로 post(=setValue) 를 하지 않아도, 각 Fragment 가 구독할 때 마다 전달받을 것이다.

**즉, 이벤트를 구독하는 입장에서는 명시적으로 발행된 이벤트만 소비하고 싶은데 자꾸 이전에 발행됐던 이벤트가 전달되는 현상이 발생한다. 중요도가 높은 이벤트일수록 이러한 현상은 치명적으로 다가올 수 있다.**

*구글에 LiveData twice 만 검색해도 고통을 겪은 많은 사람들을 볼 수 있다.

![twice_call](/media/post/livedata/google_search_live_twice.png)

# 그럼 무엇을 선택해야할까?

위와 같은 이유로 인해 LiveData 를 이벤트 전달로 사용하기 위해서, onChanged 콜백이 여러번 호출되는 것을 막는 변형구조가 탄생하게 되었다. 

그럼 이벤트 전달을 할때는 무엇을 선택하는 것이 좋을까? 진행하고 있는 프로젝트 상황이 각자 다르기에 꼭 하나를 추천하기는 어려울 것 같다. 다만, 현재 진행하고 있는 프로젝트에서 SingleLiveData 와 커스텀 LiveEvent 를 섞어서 사용하고 있으므로 사용해보면서 느낀점을 정리해보면서 마무리하고자 한다.

## SingleLiveEvent

[코드](https://github.com/android/architecture-samples/blob/dev-todo-mvvm-live/todoapp/app/src/main/java/com/example/android/architecture/blueprints/todoapp/SingleLiveEvent.java) 및 [관련 포스트](https://proandroiddev.com/singleliveevent-to-help-you-work-with-livedata-and-events-5ac519989c70)를 참고하면 금방 이해할 수 있을거라 생각한다.

구조는 단순하다. MutableLiveData 를 상속받아, 명시적으로 setValue 를 호출했을 때만 데이터가 전달되도록 flag 를 걸어주었다.

- 장점은 MutableLiveData 를 상속받았기 때문에 기본적으로 메모리 관리나 LifeCycle 변경에 따른 처리를 따로 해줄필요가 없다. 사용방법도 기존의 LiveData 사용하듯이 쓰면 된다.
- 단점은 옵저버를 여러개 등록할 수 없다. 제일 처음 구독한 옵저버가 데이터를 소비하면 그 뒤에 등록된 옵저버는 데이터를 전달받을 수 없다. 따라서 글로벌 이벤트나 Activity 나 Fragment 가 동시에 이벤트를 구독하는 케이스 등에서 활용할 수 없다.

## 커스텀 LiveEvent

이 부분은 커스텀을 어떻게 하느냐에 따라 달라지기 때문에 짧게만 적겠다. 기본적인 구현 아이디어는 LifeCycleOwner 를 전달받아 생명주기에 따른 처리를 해주고, 그외에는 Observer 패턴을 그대로 따른다.

- 장점은 옵저버를 여러개 등록할 수 있으며, LiveData 구조를 따르지 않으므로 이전 이벤트가 다시 전달되지 않는다.
- 단점은 구조를 바닥부터 새로 짜기 때문에, 초기에 LiveData 보다 안정성이 많이 떨어지는 리스크가 있다.

# 마무리하며

LiveData 가 나오면서 생명주기 관리에 대한 리소스가 줄어들고 좀 더 리엑티브한 구조로 가기 쉬워진 것은 너무나 환영할 일이다. 하지만 마구잡이로 사용했다가는 새로운 고통을 안겨줄 수 있으므로 잘 이해하고 사용하는 것이 중요하다. (리엑티브한 구조는 디버깅이 너무 괴롭다..) 

LiveData 코드는 그리 양이 많지 않아 시간이 될 때 훑어보는 것도 큰 공부가 될 것이라고 생각한다.   👍