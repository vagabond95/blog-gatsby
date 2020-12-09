---
title: "[안드로이드] TextView 에서 ellipsize 가 적용되지 않는 이슈 (autoLink & movementMethod)"
date: 2020-04-12 16:32:12
category: "android"
template: "post"
description: "간단해 보이는 요구 사항, 삽질의 시작"
redirect_from:
  - /android_not_working_ellipsize_with_autolink_or_movementmethod/
---
![cover](/media/cover/ellipsis_not_working_cover.jpeg)

# TL;DR

- TextView 에서 autoLink 혹은 movemnetMethod 옵션을 사용할 경우 ellipsize 가 제대로 동작하지 않는다.
- autoLink & movementMethod 혹은 ellipsize 를 커스텀하게 구현해줄 필요가 있다.
- API 27 기준의 TextView 로 조사를 진행하였다.

# 간단해 보이는 요구 사항, 삽질의 시작

텍스트 박스의 요구사항은 다음과 같았다.

1. 내용은 최대 N 라인 까지만 노출 가능하다. 이후 내용은 말줄임 표시로 대체
2. 내용 중 web url 이 있을 경우 클릭 및 스타일링이 되어야하고 클릭 시, 인앱 브라우저로 이동해야한다.

1번 사항은 [maxLine](https://developer.android.com/reference/android/widget/TextView#attr_android:maxLines) 과 [ellipsize](https://developer.android.com/reference/android/widget/TextView#attr_android:ellipsize) 를 이용하면 된다.

2번 사항은 [autoLink](https://developer.android.com/reference/android/widget/TextView#attr_android:autoLink), [textColorLink](https://developer.android.com/reference/android/widget/TextView#attr_android:textColorLink), 커스텀한 MovemetMethod 를 이용하면 된다.

커스텀한 MoveMentmethod 가 필요한 이유는 TextView 에서 기본으로 사용되는 [LinkMovementMethod](https://developer.android.com/reference/android/text/method/LinkMovementMethod) 의 경우 특정한 link 텍스트 클릭 시, 이를 감지할 수 있는 콜백을 제공하지 않고 내부에서 ACTION_VIEW intent 로 처리하기 때문이다.
직접 구현하기가 부담스럽다면 이런 [라이브러리](https://github.com/saket/Better-Link-Movement-Method) 를 이용해도 좋다.

어쨌든 안드로이드에서 기본적으로 제공하고 있는 속성을 활용하면 금방 완료가 가능할 것으로 보고 구현을 시작했다.
그런데... 아무리 빌드를 돌려봐도 ellipsis 가 표현되지 않는다.

구글이 그럴리 없다며 내가 잘못한 부분이 없나 몇 시간째 삽질을 하다가, 결국 하나하나 옵션을 제거하면서 결과를 비교해봤고 다음과 같은 결론을 얻었다.

- autoLink 혹은 setAutoMask() 를 이용하여 autoMask 플래그를 set 해줬을 경우 ellipsize 가 제대로 동작하지 않는다.
- movementMethod 를 set 해줬을 경우 ellipsize 가 제대로 동작하지 않는다.

전혀 연관이 없을 것 같은 각 속성이 왜 충돌하는 것일까?

# setText() 와 autoLink / movementMethod

TextView 에 내용을 전달하기 위해서는 반드시 setText() 를 거쳐야한다. setText() 메소드 내부에서 autoLink 값과 movementMethod 가 영향을 주고 있는 부분은 없을까하여  setText() 내부 구현을 조사해봤다.
```java
// TextView.class
else if (type == BufferType.SPANNABLE || mMovement != null) {
    text = mSpannableFactory.newSpannable(text);
}
    
...
    
mText = text;

if (mAutoLinkMask != 0) {
    Spannable s2;
    
    if (type == BufferType.EDITABLE || text instanceof Spannable) {
        s2 = (Spannable) text;
    } else {
        s2 = mSpannableFactory.newSpannable(text);
    }

...
    
mText = s2;
```
각 코드는 모두 text 를 Spannable 로 포장 해주고 있다. 이 부분을 잘 기억해 두자.

autolink 는 Link 에 해당하는 내용을 스타일링 해주고, movementMethod 는 link 를 클릭 했을 때 특별한 상호작용이 이루어져야 하므로 plain text 가 아닌 spannable 로 포장 해주는 것은 어느정도 납득이 간다. 그럼 이러한 특징이 ellipsize 에 어떤 영향을 줄까?

# ellipsize 적용 과정

TextView 에서 Ellipsize 과 관련된 몇가지 내용을 조사해봤다.

1. TextView 의 설정이 같더라도 디스플레이 환경에 따라 실제 보이는 결과는 다를 수 있다. 그리고 실제 화면 상에 보이고 있는 TextView 에 대한 정보는 [Layout]([https://developer.android.com/reference/android/text/Layout](https://developer.android.com/reference/android/text/Layout)) 에서 가져올 수 있다. (LinearLayout 과 같은 ViewGroup Layout 이 아니다!)

따라서 ellisize 가 적용된 결과도 layout 을 통하여 가져와야 한다.

2. TextVeiw 내부에서 Layout 을 생성하는 과정에서 ellipsize 가 적용되며, 이때 mMaximumVisibleLineCount 값을 기준값으로 사용한다.

여기까지만 봤을 때는 아직 특별한 연관성을 찾기 어렵다. Layout 을 생성하는 과정을 좀 더 살펴보자.
```java
// TextView.class
if (mText instanceof Spannable) {
    result = new DynamicLayout(...);
    // ...
}
```

이전 단락에서 autoLink 혹은 movementMethod 를 사용했을 경우 mText 는 spannable 로 포장된다고 한 것을 떠올려 보자. 그리고 mText 가 spannable 일 경우 Layout 은 DynamicLayout 으로 생성된다.  
DynamincLayout 은 내부적으로 StaticLayout 을 이용하여 Text 를 렌더링하는데, **이때 StaticLayout 에 mMaximumVisibleLineCount 값을 따로 설정 해주지 않는 특징이 있다**. 즉, mMaximumVisibleLineCount 는 디폴트 값인 Integer.MAX_VALUE 으로 초기화 된다.   
따라서 보여줄 수 있는 line 의 수가 의미상 무한대에 가까우므로 ellipsis 는 표현되지 않는다. 

# 원인 정리

내용이 길었는데 원인을 정리하면 다음과 같다.

1. ellipsize 는 mMaximumVisibleLineCount 값을 기준으로 노출여부가 결정된다. 이 값은 보통 maxLines 값으로 초기화 된다.
2. autoLink or movementMethod 는 text 를 spannable 로 포장한다.
3. text 가 spannable 하면 mMaximumVisibleLineCount 이 MAX_VALUE 인 Layout 을 생성한다. 따라서 ellipsize 가 노출되지 않는다.

# 해결책

결국 위 상황을 해결하기 위해서는 2가지 옵션이 있다.

1. ellipsize 를 커스텀하게 구현한다.
2. autoLink / movementMethod 를 커스텀하게 구현한다.

간단해보이는 View 라도 막상 구현하다보면 생각치도 못한 엣지 케이스, 예외들이 너무 많이 발생하는 것을 경험했고 나는 이것을 유지보수 할 자신이 없었다. 그래서 최대한 기존에 구현된 내용을 이용하고자 했다.

각각 ellipsize 는 실제로 영향을 받는 부분이 많았고 구현이 너무 깊숙히 숨겨져있어 외부에서 컨트롤 할 수 있는 타이밍이 없을 것 같아 보류하였고
autoLink / movementMethod 는 구현 내용을 살펴보니 TextView 외부에서도 처리가 가능할 것 같았다. 
따라서 autoLink / movementMethod 를 기존 구현을 최대한 참고하여 구현해보기로 하였다.

## autoLink 적용하기

TextView 내부에서 autoLink 가 적용되는 과정은 크게 2가지로 나눌 수 있다.

1. Linkify 를 이용하여 text 에 link 스타일링
2. 조건이 충족되면 디폴트 movementMethod 를 set

1 번 과정은 똑같이 Linkify 를 이용하여 적용하면된다.
2번 과정은 오히려 막아야 하므로 조건을 충족시키지 않도록 해야한다. setLinksClickable() 를 이용하여 조건 값을 설정할 수 있다.
```java
mTextView.setLinksClickable(false); // 디폴트 movementMethod 를 사용하지 않겠다.
    
mTextView.setText("Hello https://google.com !");
Linkify.addLinks(mTextView, Linkify.WEB_URLS);
```

## movementMethod 적용하기

MovementMethod 인터페이스의 역할은 link 텍스트 클릭 이벤트를 감지하여 미리 정의된 동작을 수행하는 것이다.

디폴트로 사용되는 LinkMovementMethod 의 내부 구현을 살펴보면, 텍스트 터치 시 텍스트에 Clickable 한 span 이 있는지 감지하여 onClick 콜백을 호출해준다. ClickableSpan 은 곧 link 텍스트라고 봐도 좋다.

나는 link 텍스트를 감지하는 부분에 대한 구현만 그대로 가져와, 감지 했을 시 내가 넣어둔 콜백이 수행되는 커스텀 TouchListener 를 생성하여 사용하였다. 
(LinkMovementMethod - onTouchEvent  내부 구현을 보면 어렵지 않게 힌트를 얻을 수 있을 것이다.)
```java
mTextView.setOnTouchListener(mCustomUrlTouchHandler);
```

# 결론
약간의 우회를 통하여 결과적으로는 ellipsize 도 적용되고, autoLink / movementMethod 도 이용할 수 있는 구현을 완성하였다. 하지만 말 그대로 우회일뿐 언제 이슈 케이스가 발견될지 모르기에 아직은 걱정되는 부분이 많다. 
해당 이슈가 리포트된지 꽤 오랜 시간이 지났음에도 해결되지 않아 많은 사람들이 고통을 겪고 있는 듯 하다. 일해라 구글! 😡