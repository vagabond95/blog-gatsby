---
title: "[안드로이드] 키보드 높이 구하기"
date: 2019-09-08 15:57:53
category: "Android"
template: "post"
draft: false
description: "Android 개발을 진행하다보면 Keyboard Height 를 알고싶은 상황을 마주할 때가 있다. 하지만 안타깝게도 Android에서 Keyboard Height 를 알 수 있는 native API 는 제공되지 않는다."
socailImage: "/media/cover/android-keyboard-height-cover.jpg"
redirect_from:
  - /2019/09/08/android-keyboard-height/
---
![cover](/media/cover/android-keyboard-height-cover.jpg)
Android 개발을 진행하다보면 Keyboard Height 를 알고싶은 상황을 마주할 때가 있다. 하지만 안타깝게도 **Android에서 Keyboard Height 를 알 수 있는 native API 는 제공되지 않는다.**  따라서 약간의 편법(?)을 통해 값을 알아내야 하는데, 오늘 포스팅에서는 그 과정을 다뤄보려 한다.


# 원리

Keyboard height 를 구하는 방법에 대한 다양한 접근법이 제시되고 있으나, 결국 핵심원리는 다음과 같다.

1. 키보드가 없을 때 화면 전체의 높이를 구한다.
2. Keyboard 가 올라왔을 때, Keyboard 가 가리고 있는 부분을 제외한 화면의 높이를 구한다.
3. 1번 값 - 2번 값 = Keyboard Height


# 구현

화면이라는 단어는 자체는 매우 추상적이다. 위 원리의 핵심은 화면의 높이를 구하는 것이므로 코드 레벨의 사전 정의가 필요해보인다.
해당 포스트에서는 안드로이드에서 제공하고 있는 [View](https://developer.android.com/reference/android/view/View) 클래스를 화면으로 정의했다. 그 이유는 높이를 구하는 과정에서 활용할 수 있는 API 가 모두 View 에서 제공되기 때문이다.

---

## 1. 화면의 높이를 구한다.

View 는 getHeight() 메소드를 제공하기 때문에, 높이를 알아는 것이 어렵지 않다. 문제는 getHeight() 를 통해 얻어온 높이가 해당 View 의 정확한 높이라고 보장할 수 없다. 왜냐하면 View 의 높이는 초기화되자마자 결정되는 것이 아니라 일련의 측정 단계를 거쳐 결정이 되는데, 그 단계가 끝나기 전에 getHeight() 를 호출했을수도 있기 때문이다.

따라서 정확한 View 의 높이를 알기 위해서는 View 의 크기가 결정된 이후에 getHeight() 를 호출해야 한다. 
View 에서 제공하는 [ViewTreeObserver.OnGlobalLayoutListener](https://developer.android.com/reference/android/view/ViewTreeObserver.OnGlobalLayoutListener) 를 이용하면 결정되는 타이밍을 캐치할 수 있다. 

OnGlobalLayoutListener 는 해당 View에 변경점이 생겼을 때, 이를 콜백형태로 감지할 수 있다. 변경되는 내용에는 View 의 크기가 결정되는 것도 포함되므로 우리는 해당 콜백이 호출되었을 때 View.getHeight() 를 호출하면 정확한 높이를 얻을 수 있다.

코드 레벨로는 다음과 같다.
```java
int viewHeight = -1;
    
rootView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
    int currentViewHeight = rootView.getHeight();
    if (currentViewHeight > viewHeight) {
        viewHeight = currentViewHeight;
    }
});
```
---


## 2. Keyboard 가 올라왔을 때, Keyboard 가 가리고 있는 부분을 제외한 화면의 높이를 구한다.

이 과정은 두가지 단계로 나누어 생각해보자.

1. Keyboard 가 언제 올라왔는지 감지
2. 현재 화면상에 보여지고 있는 영역의 높이 구하기

### (1) Keyboard 가 언제 올라왔는지 감지
1단계는 다시 [ViewTreeObserver.OnGlobalLayoutListener](https://developer.android.com/reference/android/view/ViewTreeObserver.OnGlobalLayoutListener) 를 이용하여 진행할 수 있다.

Keyboard 의 활성화/비활성화를 감지하는 아이디어는 다음과 같다.

1. (SoftInputMode 값에 따라 다르지만) 일반적으로 Keyboard 가 올라오면 Keyboard 의 크기만큼 화면의 높이가 줄어들게 된다.
2. 해당 화면(View)의 ViewTreeObserver 에 OnGlobalLayoutListener 를 등록할 경우 View의 높이가 변경될 때 이를 감지할 수 있다
3. 따라서 높이가 변경되는 시점을 Keyboard 가 활성화/비활성화 된 상황이라고 추정할 수 있다. 

View 를 이용할 수 있는 것은 알았다. 그럼 우리는 **어떤 View 를 이용하여 위 과정을 진행해야할까?**

#### 1) Activity 의 RootLayout 을 이용한다.

가장 무난하고 쉬운 선택이다. Acitivity 의 Xml 에서 root level 에 있는 layout 을 View 로 이용하는 방법이다. 실제로도 대부분의 케이스에서는 잘 동작한다.

하지만 이 방법은 치명적인 단점이 존재한다. Activity 의 [windowSoftInputMode](https://developer.android.com/guide/topics/manifest/activity-element#wsoft) 옵션 값에따라 정상적으로 동작하지 않을 수 있다는 것이다.

windowSoftInputMode 옵션은 가상 Keyboard 와 Activity 의 상호작용을 지정하는 옵션인데, 'AdjustNothing' 와 같은 일부 옵션값은 **Keyboard 가 올라와도 Activity Height 의 변화가 없기 때문에** 두번째 단계를 수행할 수 없다. 따라서 Acitivity 의 windowSoftInputMode 값에 따라 동일한 결과를 보장받지 못하기 때문에, 범용적으로 활용되기 어렵다.

#### 2) PopupWindow 를 이용한다.

좀 더 개선된 선택지이다. 

PopupWindow 는 고유의 SoftInputMode 을 별도로 지정할 수 있다. 따라서 Acitivity windowSoftInputMode 옵션이 무엇이든 영향을 받지 않고, 독립적으로 활용이 가능하다. 따라서 RootLayout 을 이용하는 1번 방식의 단점을 보완할 수 있다.

```java
public class KeyboardObserver extends PopupWindow {
    
        private void initialize() {
    
            setSoftInputMode(SOFT_INPUT_ADJUST_RESIZE | SOFT_INPUT_STATE_ALWAYS_VISIBLE);
            setInputMethodMode(PopupWindow.INPUT_METHOD_NEEDED);
    
            ...
    
            rootView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
                ...
            });
        }
    }
}
```

### (2) 현재 화면상에 보여지고 있는 영역의 높이 구하기
2단계는 View 에서 제공하는 [View.getWindowVisibleDisplayFrame()](https://developer.android.com/reference/android/view/View.html#getWindowVisibleDisplayFrame(android.graphics.Rect)) 를 활용하여 진행할 수 있다.

getWindowVisibleDisplayFrame(rect) 메소드는
해당 View 를 그리고 있는 window 를 기준으로, **현재 보여지고 있는 영역의 크기를 반환한다**. 따라서, Keyboard가 올라왔을 때 해당 메소드를 호출할 경우 Keyboard로 인하여 가려진 영역을 제외한 화면의 높이를 얻을 수 있다.

```java
    Rect visibleFrameSize = new Rect();
    view.getWindowVisibleDisplayFrame(visibleFrameSize);
    
    int visibleFrameHeight = visibleFrameSize.bottom - visibleFrameSize.top;
```

## 3. Keyboard 의 높이 구하기
각 과정의 결과를 빼기면 하면 Keyboard 의 높이를 알 수 있다.

코드레벨로는 아래와 같다.

```java
    private int originHeight = -1;

    rootView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
        getKeyboardHeight(rootView);
    });
    
    // ....
    private int getKeyboardHeight(View targetView) {
            if (targetView.getHeight() > originHeight) {
                originHeight = targetView.getHeight();
            }
    
            Rect visibleFrameSize = new Rect();
            rootView.getWindowVisibleDisplayFrame(visibleFrameSize);
    
            int visibleFrameHeight = visibleFrameSize.bottom - visibleFrameSize.top;
            int keyboardHeight = originHeight - visibleFrameHeight;
    
            return keyboardHeight;
    }
```

만약 PopupWindow 를 활용한다면 간략하게는 아래와 같이 구현할 수 있을 것이다.

```java
    public class KeyboardHeightProvider extends PopupWindow {
    
        // ...

        private View rootView;
        private int originHeight = -1;
    
        // ...

        private void initialize() {
            // 개별 SoftInputMode 세팅
            setSoftInputMode(SOFT_INPUT_ADJUST_RESIZE | SOFT_INPUT_STATE_ALWAYS_VISIBLE);
    
            // Popup window 는 보이지 않아야 하므로 0 으로 세팅.
            setWidth(0);
            setHeight(MATCH_PARENT);
    
            // ...

            rootView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
                // callback, event 등으로 height 전달
                getKeyboardHeight(rootView);
            });
        }
    
        private int getKeyboardHeight(View targetView) {
            if (targetView.getHeight() > originHeight) {
                originHeight = targetView.getHeight();
            }
    
            Rect visibleFrameSize = new Rect();
            rootView.getWindowVisibleDisplayFrame(visibleFrameSize);
    
            int visibleFrameHeight = visibleFrameSize.bottom - visibleFrameSize.top;
            int keyboardHeight = originHeight - visibleFrameHeight;
    
            return keyboardHeight;
        }
    }
```

각 단계와 코드를 보면 알겠지만 그리 깔끔하게 구현되지는 않는다. 개인적으로 native API 를 지원해줬으면 하는 바램이다. 😹
위 코드를 그대로 사용하기 보다는 각 과정의 원리를 이해하고 프로젝트의 요구사항에 맞게 상세 구현을 채워나가는 방향으로 진행하면 될 것 같다.
실제 프로덕트 레벨에서는 아직까지 사용 시 큰 이슈가 없었으나 혹시 엣지 케이스가 보이거나 더 좋은 방법이 있다면 꼭 공유해주셨으면 좋겠다. 🙌 

# 참고사항

- 만약 PopupWindow 를 이용한다면, Activity 의 레퍼런스를 가지고 있을수 있기 때문에 메모리릭 예방차원에서 반드시 onPause/onStop 생명주기내에 해당 popupWindow 를 dismiss 해주는 것을 권장한다.
- 위 방법에도 한계점은 당연히 존재한다. 바로, **한번도 Keyboard 를 활성화 시키지 않은 상태에서 Keyboard 의 높이를 구할 수는 없다는 것이다.** 다른 방법이 있을까 하여 비슷하게 Keyboard 높이를 이용한 에니메이션이 적용된 카카오톡의 동작을 살펴보았으나, 카카오톡 역시 최초로 Keyboard 가 활성화되기 전까지는 Keyboard 의 높이와는 무관한 에니메이션으로 동작하는 것을 확인하였다. 디테일은 다를 수 있으나 기본적으로 높이를 구하는 원리는 비슷할 것으로 예상된다. 추후에 활성화 여부와 상관없이 구할 수 있는 방법을 알게 될 경우 따로 포스팅으로 공유하려 한다.
- 위 구현은 화면의 Orientation 이 고려되어 있지 않다. 만약 화면 회전이 가능한 앱의 경우 각 orientation/높이를 key/value 로 하는 map 을 이용하여 관리하는 것도 하나의 방법이다.