---
title: "[안드로이드] TextView 에서 textIsSelectable와 LinkMovementMethod를 같이 사용할때 발생하는 이슈"
date: 2018-06-13 00:12:29
category: "Android"
template: "post"
draft: false
description: "며칠 전부터 이슈트래킹 대시보드에서 아래 에러가 빈번하게 리포트되는 일을 겪었다."
redirect_from:
  - /2018/06/13/text_is_selectable_issue/
---

## 발단

며칠 전부터 이슈트래킹 대시보드에서 아래 에러가 빈번하게 리포트되는 일을 겪었다.
```
    Fatal Exception: java.lang.IndexOutOfBoundsException: setSpan (-1 ... -1) starts before 0
           at android.text.SpannableStringInternal.checkRange(SpannableStringInternal.java:442)
           at android.text.SpannableStringInternal.setSpan(SpannableStringInternal.java:163)
           at android.text.SpannableStringInternal.setSpan(SpannableStringInternal.java:152)
           at android.text.SpannableString.setSpan(SpannableString.java:46)
           at android.text.Selection.setSelection(Selection.java:76)
           at android.widget.TextView.semSetSelection(TextView.java:13203)
```
코딩을 할 때 신경써서 범위를 지정하지 않을 경우 종종 겪는 에러였는데, 디버깅을 해도 해당 부분은 모두 예외처리가 잘 되어있어 원인을 쉽게 찾을 수 없었다.

## 해결

그러던 중 우연히 재현 조건을 찾게 되었고, 조건은 TextView 에서 특정 텍스트를 복사하려고 드래그를 시도할 때 랜덤하게 크래시가 발생했다. 복사 기능은 TextView 의 `textIsSelectable` 옵션을 활용하여 제공하고 있었기 때문에, ‘textIsSelectable’ 과 ‘IndexOutOfBoundsException’ 키워드를 엮어 내용을 찾아보니 [힌트가 될만한 정보](https://stackoverflow.com/questions/15836306/can-a-textview-be-selectable-and-contain-links) 를 얻을 수 있었다.

내용인즉, `textIsSelectable` 옵션과 `LinkMovementMethod` 를 같이 사용했을 때 의도하지 않은 결과가 나올 수 있다는 것이었다. **`LinkMovementMethod` 는 안드로이드에서 제공하는 녀석이어서 원인이 될 것이라고 생각하지 못했다.** 우리 프로젝트에서도 `textIsSelectable` 옵션이 적용된 TextView 에서 `LinkMovementMethod` 를 같이 사용하고 있었기에, 혹시나 하는 마음으로 위 내용을 참고하여 CustomMovementMethod 만든 후 적용시켜봤다. 그리고 다시 테스트를 반복하여 시도해본 결과 더이상 크래시가 발생하지 않았다.
## 원인

버그를 해결하고 나서 위 문제가 발생한 원인을 다시 생각해 봤다.

1. 발단은 span 을 적용하는 과정에서 문제가 발생한 것이었다.
2. 위 재현조건에서 span 을 적용하는 상황은 `textIsSelectable` 옵션을 활성화한 TextView 에서, 특정 text 에 대해 드래그를 했을 배경에 컬러가 입혀지는 상황이다.
3. ‘textIsSelectable 옵션만 적용했을 때’ 는 위 크래시가 발생하지 않는것으로 보아, `LinkMovementMethod` 내부에서 **드래그 영역의 컬러에 대한 span이 적용되는 범위를 임의로 컨트롤**하는 로직이 있음을 유추할 수 있었다. 좀 더 세밀하게 추적하기 위해 `LinkMovementMethod` 코드를 그대로 가져와서 로그를 추가한 뒤 다시 상황을 재현해보았다.
4. **원인을 찾았다!**

```java
    ClickableSpan[] links = buffer.getSpans(off, off, ClickableSpan.class);
    
          if (links.length != 0) {
            if (action == MotionEvent.ACTION_UP) {
              links[0].onClick(widget);
            } else if (action == MotionEvent.ACTION_DOWN) {
              Selection.setSelection(buffer,
                  buffer.getSpanStart(links[0]),
                  buffer.getSpanEnd(links[0]));
            }
            return true;
          } else {
            Selection.removeSelection(buffer);
          }
```
    
5. LinkMovementMethod 의 경우 TextView 에 대한 touch 이벤트를 감지할 수 있는 `onTouchEvent` 라는 콜백 메소드가 존재하며, 위 코드가 해당 콜백의 핵심 로직이다. 코드를 잘 살펴보면 buffer 로 들어온 text에 ClickableSpan이 없을 경우에는 buffer 의 selection 을 초기화 하는 과정을 수행한다. 그런데 위에서 적었던 stacktrace 내용을 살펴보면 드래그 영역에 대한 span 의 범위는 결국 selection 으로 부터 가져오기 때문에 selection을 초기화해버릴 경우에 의도하지 않은 동작이 발생하게 되는 것이다.

## 결론

위 이슈를 겪으면서 얻은 결론은 두가지이다.

1. TextView 에서 `textIsSelectable` 과 `LinkMovementMethod` 를 같이 사용하는 것은 좋지 않으며, 부득이하게 사용해야 할 경우 Custom 하게 만들어서 사용하는 것이 좋다.
2. Android 에서 제공하는 API도 문제의 원인이 될 수 있다. 다만 이 부분은 직접 겪기전까지는 알기 어려울 듯 하다.