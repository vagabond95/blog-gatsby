---
title: "left, right, top, bottom 의 모든 것"
date: 2020-12-18 16:42:27
draft: false
category: "Android"
template: "post"
description: "View 를 다루는 개발을 하다보면 자주 접하는 개념이 있다."

---
View 를 다루는 개발을 하다보면 자주 접하는 개념이 있다. 

> Left, Right, Top, Bottom

위 개념은 view 좌표, 크기 등을 나타날 때 모두 사용된다. 큰 틀에서는 **모두 비슷한 의미를 담고 있는데** 텍스트로는 잘 이해가 되지 않아서 시각적으로 표현을 해봤다.

![example1](/media/post/lefttobottom/1.png)

사각형의 형태로 나타나는 것을 알 수 있다. 본래 사각형을 표현하기 위해서는 각 꼭지점 4개에 대한 8개의 좌표 값이 필요하지만 하지만, 각 축에 평행한 사각형으로 가정할 경우 마주보지 않는 2개의 꼭지점만 정의되면 되므로 위와 같이 4개의 값으로 표현이 가능하다.

공통 적인 내용은 이 정도이고, 위 그림을 바탕으로 각 영역에서 어떤 의미로 사용되는지 알아보자.

# view 좌표에서 가지는 의미

 좌표계 내에서 각 단어는 다음과 같은 의미를 가지고 있다.

- left : view 시작점의 x 좌표
- top : view 시작점의 y 좌표
- right : view 종료점의 x 좌표
- bottom : view 종료점의 y 좌표

여기에 canvas 좌표계는 [0, 0] 부터 시작되는 특성을 이해하면, 최종적으로 다음과 같이 view 좌표를 표현함을 알 수 있다.
![example2](/media/post/lefttobottom/2.png) 

이러한 내용을 바탕으로 실제로 자주 사용되는 API 하나를 살펴보자.

### View.getLocationOnScreen()

```java
public void getLocationOnScreen(@Size(2) int[] outLocation) {
        getLocationInWindow(outLocation);

        final AttachInfo info = mAttachInfo;
        if (info != null) {
            outLocation[0] += info.mWindowLeft;
            outLocation[1] += info.mWindowTop;
        }
    }
```

window 의 left 와 top 을 넘겨주므로 스크린 기준에서 view 의 시작점을 넘겨준다고 이해할 수 있다. 

### 절대 좌표와 상대 좌표

안드로이드에서 좌표값을 다룰 때 절대 좌표와 상대 좌표로 분류할 수 있다.

- **절대 좌표**는 Screen 기준에서의 위치를 의미한다. 대표적으로 getLocationOnScreen(), motionEvent.getRawX() 등을 통해 얻어오는 좌표가 절대 좌표이다.
- 상대 좌표는 Parent view 기준에서의 위치를 의미한다. 대표적으로 MotionEvent.getX(), view.setX() 등에서 다루는 좌표가 상대 좌표다.

# view 크기에서 가지는 의미

view.getWidth(), view.getHeight() 는 measure 과정을 거쳐 확정된 view 의 크기를 반환한다.

각 메소드의 내부를 보면 각각 다음과 같이 구현되어 있다.

```java
// View.class

public final int getWidth() {
    return mRight - mLeft;
}

public final int getHeight() {
    return mBottom - mTop;
}
```

 뷰의 크기를 나타낼 때 각 단어는 다음과 같은 의미를 가지고 있다.

- left : 부모 뷰의 왼쪽 edge 와 **자신의 왼쪽** edge 간의 거리
- right : 부모 뷰의 왼쪽 edge 와 **자신의 오른쪽** edge 간의 거리
- top : 부모 뷰의 상단 edge 와 **자신의 상단** edge 간의 거리
- bottom : 부모 뷰의 상단 edge 와 **자신의 하단** edge 간의 거리

그림으로는 다음과 같다.
![example3](/media/post/lefttobottom/3.png)

이제 getWidth() 와 getHeight() 의 내부 구현 방식을 이해할 수 있게 됐다.

해당 내용을 조사하다 보니 재밌는 사실을 알게 되었다.

## left ~ bottom 은 view 가 실제 화면에 보여지는 수치이다.

view 가 실제 화면에 보이는 영역의 좌표를 가져올 때 getGlobalVisibleRect() 를 이용하곤 한다. 그런데 해당 메소드의 구현 내용을 보니, 

```java
public boolean getGlobalVisibleRect(Rect r, Point globalOffset) {
        int width = mRight - mLeft;
        int height = mBottom - mTop;
        if (width > 0 && height > 0) {
            r.set(0, 0, width, height);
            if (globalOffset != null) {
                globalOffset.set(-mScrollX, -mScrollY);
            }
            return mParent == null || mParent.getChildVisibleRect(this, r, globalOffset);
        }
        return false;
    }
```

**mRight - mLeft** 을 visibleWidth 로, mBottom - mTop 을 visibleHeight 로 set 해주는 것을 확인할 수 있다. 즉,  이 수치들은 실제 화면에 보여지고 있는 view 의 크기를 나타내고 있음을 의미한다. 즉, left ~ bottom 은 고정된 값이 아니다. 어찌보면 당연할 수 있는 내용이지만 위 내용을 알고 보니 또 새롭다.

# 그외 영역에서 활용하는 케이스

View 를 low 레벨로 조작하다보면 [Rect](https://developer.android.com/reference/android/graphics/Rect) 를 넘기거나 리턴형으로 받는 케이스가 종종 있다. Rect 는 left ~ bottom 4개의 멤버변수를 가지고 있으며 위에서 다룬 좌표와 크기 개념을 모두 포함한다.

즉, 4개의 값을 이용하여 사각형 영역을 정의할 수 있고(좌표계) 이를 바탕으로 width(), heigth(), centerX() 등의 유용한 메소드를 제공한다. (크기)

```kotlin
val square = Rect(0, 0, 100, 100) // 100 x 100 정사각형
val rectengle = Rect(0, 0, 40, 100) // 40 x 100 직사각형
```