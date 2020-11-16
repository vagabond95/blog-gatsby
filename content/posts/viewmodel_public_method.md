---
title: "[안드로이드] ViewModel 에 대한 고찰 : public 메소드"
date: 2020-06-07 19:27:42
category: "android"
template: "post"
description: "MVVM 기반으로 프로젝트를 진행할 때 팀 내에서 가장 많은 논의가 오고 갔던 부분은 역시 ViewModel 이었다."
tags: 
    - MVVM
---
MVVM 기반으로 프로젝트를 진행할 때 팀 내에서 가장 많은 논의가 오고 갔던 부분은 역시 ViewModel 이었다. 이번 글은 그 중 ViewModel 의 public 메소드에 대하여  적어보려 한다.

# 종류 및 구현 방식

ViewModel 은 보통 세 종류의 public 메소드를 제공한다.

1. View 가 원하는 명령을 수행하기 위한 트리거형 메소드
2. LiveData 등의 이벤트 옵저버 Getter
3. 특정 값 Getter (되도록 지양!)

2개는 Getter 이므로 크게 논의할만한 부분이 없고, 첫 번째인 트리거형 메소드에 대해 다룰 것이다.

# 초기 구현 방식과 문제점

초기 MVVM 패턴을 적용하여 화면을 만들 때 다음과 같이 구현하였다.

```java
public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

				...        
        mUserCategoryViewModel.loadUserCategory();
    }

    private void initializeClickListener() {
        mDeleteAllButton.setOnClickListener(view -> mUserCategoryViewModel.deleteAllCategory());
    }
}
```

```java
class MyViewModel {

    public void loadUserCategory() {
			// Call API
    }
		
		public void deleteAllCategory() {
      // Delete all
		}

```

## 문제점

위 구현은 ViewModel 이 비즈니스 로직을 수행할 수 있는 메소드를 public 하게 제공하고 있고, 이를 View 가 직접 호출하고 있는 형태이다. 이는 곧 다음과 같은 문제점에 직면하게 된다.

- View 가 비즈니스 로직 진행 과정을 알고 있어야 함을 의미한다.

    → 예를 들어 위 예제 코드에서 전체 삭제 버튼을 눌렀을 때, 전체 삭제 외에 추가적인 과정이 수행되야 하는 스펙이 추가 되는 것을 가정 해보자. 이는 곧 View 에서 신규 스펙과 관련된 viewModel 의 메소드를 추가로 호출해줘야 함을 의미한다. 즉, ViewModel 레벨의 변경사항이 View 에 영향을 끼친다. (기존의 deleteAllCategory 메소드에 신규 스펙의 내용을 구현하는 것은 SRP 규칙에 위배된다.)

- 해당 화면의 컨텍스트를 모르는 개발자는 전체적인 흐름을 파악하기 위해 View, ViewModel 모두를 확인해야만 한다.

# 개선안

코드를 먼저 살펴보자.

```java
public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

				...        
        mUserCategoryViewModel.onEnterView();
    }

    private void initializeClickListener() {
        mDeleteAllButton.setOnClickListener(view -> mUserCategoryViewModel.deleteAllCategory());
    }
}
```

```java
class MyViewModel {

		public void onEnterView() {
				loadUserCategory();
    }

    public void onClickDeleteAllButton() {
				deleteAllCategory();
    }

    private void loadUserCategory() {
			// Call API
    }
		
		private void deleteAllCategory() {
      // Delete all
		}
}
```

초기 구현 대비 바뀐 것은 2가지이다.

**1. ViewModel 은 내부 비즈니스 로직을 직접 수행할 수 있는 메소드를 public 하게 제공하지 않는다.**

기존 메소드의 접근제한자를 private 로 변경하였다. 이제 View 는 더이상 비즈니스 로직을 수행하는 메소드를 직접 호출할 수 없다. 

**2. ViewModel 의 public 메소드는 View 레벨의 특정한 이벤트를 지칭하는 네이밍을 가진다.**

View 가 ViewModel 에게 명령할 트리거 메소드는 여전히 필요하기에 새로운 트리거 메소드를 생성하였다. 해당 메소드는 View 의 특정 이벤트가 발생 했음을 나타내는 네이밍을 가진다. 또한 기존의 비즈니스 로직 메소드를 내부에서 수행한다. 이러한 변경사항은 다음과 같은 이점을 가진다.

- View 는 더이상 내부 비즈니스 로직의 수행 과정을 알 필요가 없다. 단지 View 이벤트가 발생했다고 ViewModel 에 전달 해주면 된다.
- ViewModel 의 비즈니스 로직에 추가 스펙이 들어오더라도 View 에 전파되지 않는다.
- 해당 화면의 컨텍스트를 모르는 개발자가 코드를 보더라도 비즈니스 로직이 한곳에 모여있으므로 파악이 용이하다. 
ex) 전체 삭제 버튼이 눌렸을 때 수행 되는 일이 궁금하다면 onClickDeleteAllButton 메소드의 구현 내용만 확인하면 된다!

위 변경사항을 통해 ViewModel 을 한단계 더 캡슐화하는 효과를 얻게 되었다.

# 효과

유저로 부터 리포트되는 이슈의 상당수는 'XXX 를 클릭했을 때 안돼요.' 와 같이 특정 View 이벤트와 관련된 내용이 많다. 개선된 내용을 적용하고 난 후에는 해당 화면에 속한 ViewModel 의 트리거 메소드만 확인하면 바로 관련된 비즈니스 로직을 파악할 수 있기 때문에 개발 능률이 향상되는 효과를 얻었다.

더 변경하기 쉽고, 이해하기 쉬운 코드를 위한 여정은 계속된다.  🤟