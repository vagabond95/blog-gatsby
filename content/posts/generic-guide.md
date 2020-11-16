---
title: "[Java] Generic 도장깨기"
date: 2020-07-31 18:04:19
category: "java"
template: "post"
description: "제네릭을 활용할 일이 많은데 겉핥기 식으로만 알고 있다는 생각이 들어 이번 기회에 관련 내용들을 정리했다."
redirect_from:
  - /2020/07/31/generic_guide/
---
![](/media/cover/generic_guide.jpg)
제네릭을 활용할 일이 많은데 겉핥기 식으로만 알고 있다는 생각이 들어 이번 기회에 관련 내용들을 정리했다.

# 무엇인가?

제네릭은 클래스, 인터페이스 및 메서드를 정의할 때 내부에서 사용될 type 을 parameter 로 전달할 수 있는 개념이다.

간단히 아래와 같이 표현이 가능하다.

```java
public class GenericsClass <T> { }
public interface GenericsInterface <T> { }
public class MultiGenericsClass <K, V> { } // 여러개도 가능하다!

public <T> void getResult(T parameter) {
    // do something with parameter
}
```

위 예시에서 GenericsClass, GenericsInterface 처럼 type parameter 를 전달받는 클래스 / 인터페이스를 **Parameterized Types** 라고 칭하기도 한다.

# 왜 사용하는가?

## 사용 시 장점

- 컴파일 타임에 타입 체크 가능
- 캐스팅 불필요
- 특정 타입에 종속되지 않은 유연한 로직

## 사용 시 단점

단점이 있다면 **코드의 가독성이 떨어지게 된다.** 사실 이건 제네릭만의 단점이라기보다 보통 유연하고 느슨한 코드일 수록 가독성이 떨어지게 되는데 일종의 트레이드 오프라고 볼 수 있다.

# Subtyping

자바는 is - a 관계일 경우 아래 코드가 문제없이 작동한다.

```java
Object newData = new Object();
Integer newNumber = Integer.valueOf(1);
newData = newNumber;
```

제네릭 콜렉션에 값을 추가할 때도 마찬가지이다.

```java
List<Object> objects = new ArrayList<>();
object.add(1);
object.add("name");
```

그러나 아래 코드는 에러가 발생한다.

```java
List<Object> objects = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();
objects = numbers; // compile time error
```

List\<Integer\> 는 List\<Object\> 의 **서브타입이 아니기 때문이다.** 이를 Invariant (무공변성, 불변성) 하다고 이야기 한다. 이에 대해서는 Type Bound 파트에서 좀 더 자세히 다뤄보자.

Parameterized Type 이 기본적으로 불변성을 가지는 이유는 타입 안정성을 컴파일 타임에 보장하기 위해서이다. 만약 Parameterized Type 에 subtyping 이 허용된다고 가정해보자. 그렇게 되면 어떤 타입의 파라미터가 넘어올지 컴파일 타임에 미리 아는 것이 불가능하고, 예외 발생을 막기위해 지속적으로 타입 체크가 필요하다.  즉, 제네릭의 장점을 전혀 취할 수 없게 된다. 따라서 타입 안정성을 보장하기 위해서 Parameterized Type 은 기본적으로 Invariant 하다.

# Type Bound 와 Variance

Computer Science 에는 Variance 라는 개념이 있다.

> Variance refers to how subtyping between more complex types relates to subtyping between their components.

쉽게 얘기하면 element 와 element 를 포함하고 있는 컴포넌트가 있을 때 element 간의 sub type 관계가 컴포넌트간의 sub type 관계에 영향을 주는 정도를 의미한다.

영향도에 따라 다음과 같이 나눌 수 있다. 


- Invariant (무공변성) : T → T' 일 때 \<T\>, \<T'\> 는 서로 별개의 타입이면 \<T\> 는 Invariant 하다.
- Covariant (공변성) : T→ T' 일 때 \<T\> → \<T'\> 가 성립하면 \<T\> 는 covariant 하다.
- Contravariant (반공변성) : T → T' 일 때 \<T\> ← \<T'\> 가 성립하면 \<T\> 는 contravariant 하다.

T 는 element, \<T\> 는 element를 포함하는 컴포넌트를 의미하며 A → B 이면 **A 는 B 의 서브 타입이다.** 이때 서브 타입은 자바의 상속만이 아니라 더 넓은 개념인 [Subtyping](https://en.wikipedia.org/wiki/Subtyping) 을 의미한다.  

제네릭은 Type bound 를 적용하여 parameterized type 의 Variance 를 결정할 수 있다. 화살표 방향에 유의하며 하나씩 살펴보자.

```java
// 예시 클래스
class Animal {}
class Cat extends Animal {}
class KoreanShortHair extends Cat {}
```

## 1. Unbounded type

> \<T\>, <?>

- 제네릭 타입 선언 후 아무런 키워드도 붙히지 않으면 unbounded type 이다.
- Unbounded type 타입 파라미터로 선언된 Parameterized type 은 모든 타입 파라미터에 대해 **Invariant** 하다.
- Cat → Animal 일때 \<Cat\> 와 <? extends Animal> 는 서로 아무런 연관관계를 가지지 않는 각각 별개의 타입이다.

```java
List<Animal> animals = new ArrayList<>(); // unbounded type parameter
List<Cat> cats = new ArrayList<>();

animals = cats // Fail, 서로 다른 타입으로 판단한다.
```

## 2. Upper bounded type

> <T **extends** Animal>, <? **extends** Animal>

- Upper bounded type 은 제네릭 타입 선언 후 extends 키워드를 이용하여 구현가능하다.
- Upper bounded type 타입 파라미터로 선언된 Parameterized type 는 자기 자신 혹은 하위 클래스의 타입 파라미터에 대해 **Covariant** 하다. 
- 예를 들어 Cat → Animal 이면 \<Cat\> → <? extends Animal> 이다.


```java
List<? extends Animal> animals = new ArrayList<>(); // upper bounded parameterized type
List<Cat> cats = new ArrayList<>();
List<KoreanShortHair> koreanShortHairs = new ArrayList<>();

animals = cats; // Ok, cats 는 animals 의 서브타입이다.
animals = koreanShortHairs; // Ok, koreanShortHairs 는 animals 의 서브타입이다.
```

## 3. Lower bounded type

> <T **super** Cat>, <? **super** Cat>

- Lower bounded type 은 제네릭 타입 선언 후 super 키워드를 붙히고 원하는 타입을 적으면된다.
- Lower bounded type 타입 파라미터로 선언된 Parameterized type 는 자기 자신 혹은 상위 클래스의 타입 파라미터에 대해 **Contravariant** 하다.
- 예를 들어 Cat → Animal 이면 \<Animal\> → <? super Cat> 이다.

```java
List<Animal> animals = new ArrayList<>();
List<? super Cat> superCats = new ArrayList<>(); // lower bounded parameterized type
List<KoreanShortHair> koreanShortHairs = new ArrayList<>();
        
cats = animals; // Ok, animals 는 superCats 의 서브 타입이다.
cats = koreanShortHairs; // Fail, KoreanShortHair 는 Cat 의 상위클래스가 아니다.
```

## Multi bound

Upper bounded type 에 한하여 N 개의 bound 적용이 가능하다. 이때 사용되는 연산자는 **&** 이다. 특징은 다음과 같다.

- 자바는 다중 상속이 허용되지 않는다. 따라서 부모 클래스가 2개 이상일 수 없으므로 Multi bound 에서 bound 할 수 있는 클래스 타입은 0 ~ 1개 이다.
- 위와 같은 맥락으로 인터페이스 타입은 bound 개수 제한이 없다.
- 클래스 타입과 인터페이스 타입을 같이 사용할 경우 클래스 타입이 제일 앞에 선언되어야 한다.

```java
class A {}
interface B {}
interface C {}

class Test <T extends A & B & C>

public <T extends Number & Comparable<? super T>> int compareNumbers(T t1, T t2){
    return t1.compareTo(t2);
}
```

Test 클래스의 타입 파라미터 T 는 A 의 서브타입이고, B 와 C 를 구현해야한다. 

compareNumbers 메소드의 타입 파라미터 T 는 Number 의 서브타입이고, Comparable 를 구현해야한다. 

## 어디에 활용할 수 있을까? (PECS)

Type bound 를 활용하면 기본 제네릭에서 한번 더 확장이 가능하므로 좀 더 유연한 코드가 될 수 있다. 하지만 어떤 케이스에서 활용해야할지 감이 잘 오지 않는다. 이를 위하여 PECS 라는 규칙이 나오게 되었다.

PECS 란 Producer - extends, Consumer - super 의 약자이다. 생산자는 extends 를 소비자는 super 키워드를 활용하라는 의미이다.

생산자, 소비자라는 표현이 직관적으로 와닿지 않으므로 다음과 같이 이해해도 좋다.

> Read - extends, Write - super

왜 그런지 한번 살펴보자.

```java
// extends

public void read(List<? extends Animal> animals) { 
    for (Animal animal : animals) {
        print(animal.toString()); // OK
    }
}

public void write(List<? extends Animal> animals) { 
    animals.add(new Animal()); // compile time error
    animals.add(new Cat()); // compile time error
}

// super

public void read(List<? super Cat> cats) { 
    for (Cat cat : cats) {
        print(cat.toString()); // compile time error
    }    
}

public void write(List<? super Cat> cats) { 
    cat.add(new Animal()); // compile time error
    cat.add(new KoreanShortHair()); // OK
}
```

**Read - extends**

- read 메소드를 살펴보면 animals 의 각 element 를 Animal 타입으로 읽는 것은 문제 되지 않는다. 왜냐하면 어떠한 List 가 들어오더라도 내부 element 는 최소한 Animal 을 상속받았을 것이 보장되기 때문이다.
- 한편 write 메소드를 살펴보면 add 를 시도할 경우 자신을 포함한 Animal 의 하위 타입을 전달했을 때 오류가 발생한다. 이유는 전달된 animals 의 element 는 animal 을 상속받은 것만 보장할뿐 구체적으로 어떤 타입인지는 알 수 없기 때문이다. 이를 허용할 경우 런타임에 타입 불일치로 오류가 발생할 수 있는 가능성이 생길 수 있다. (ex / List\<Cat\> 을 전달받았는데 Animal 객체를 추가하는 경우)

따라서 상방으로 닫혀있는 extends 는 read 에 적합하다.


**Write - super**

- write 메소드를 먼저 살펴보면 cats 는 cat 의 **하위타입에 한하여** 어떠한 객체든 추가가 가능하다. cats 의 element 는 Cat 의 상위 타입인 것이 보장되기 때문이다.  ( ? → Cat → ? super Cat )
- read 메소드를 살펴보면 이제 슬슬 감이 온다. cats 의 element 는 Cat 의 상위 타입이므로 항상 Cat 자신이라고 보장할 수 없기 때문에 Cat 이라는 타입으로 확정지어 사용할 수 없다.

만약, read & write 를 모두 하는 케이스의 경우 type bound 를 사용할 수 없다!

# Wildcard

Type bound 파트에서 먼저 언급이 되었는데, **<?>** 와 같이 물음표를 이용하여 제네릭 타입을 표현하는 것을 와일드 카드라고 부른다. 와일드 카드는 다음과 같은 특징이 있다.

- 어떤 타입이든 가리지 않고 전달이 가능하다.
- 제네릭 클래스의 파라미터, 제네릭 메소드의 인자 자체로는 사용이 불가능하다.

    ```java
    class TestClass <?> { } // 불가능

    public void invokeTest(<?> parameter) { } // 불가능
    ```

Type bound 에 따라 불리는 명칭이 다르다.

- <?> : unbounded wildcard
- <? extends Animal> : upper bounded wildcard
- <? super Animal> : lower bounded wildcard

upper bounded wildcard, lower bounded wildcard 에 대한 얘기는 Type bound 파트에서 이미 대부분 다뤘으므로 unbounded wildcard 에 대해서만 잠깐 정리해보자.

## <?> : unbounded wildcard

unbounded wildcards 는 제네릭 계의 Object 클래스 이다.  따라서 실제 특징도 Object 와 비슷하다.

- **? 를 Object 로 바꿔서 사용하는 것이 가능하다.**

    → unbounded wildcard type 은 컴파일 과정에서 Object 타입으로 판단하기 때문에 코드상에서 Object 로 취급하여도 오류가 발생하지 않는다. (후술할 reifiable type 이기도 하다.)

- **<?> 는 Covariant 하다.**

    → 모든 T에 대하여 T → ?, \<T\> → <?> 가 성립한다.  

이러한 특징을 고려하여 활용할 수 있는 케이스는 크게 2가지가 있다.

### 1. Object 클래스가 제공하는 기능을 사용하여 구현 해야할 때

Object 타입 기반의 메소드가 있다고 가정하자.

```java
public void parseString(List<Object> objects) {
    for (Object object : objects) {
        print(object.toString());
    }
}
```

해당 메소드는 Object 타입 List 를 전달받으므로 범용성이 클 것 같지만 위에서 다룬 Variance 룰에 의하여 List\<Integer\>, List\<String\> 과 같은 Object 하위 타입 리스트를 전달할 수 없다. 이때 unbounded wildcard 를 이용하면 해결할 수 있다.

```java
public void parseString(List<?> objects) {
    for (Object object : objects) {
        print(object.toString());
    }
}
```

### 2. 타입에 의존하지 않는 로직을 수행할 때

List 의 size(), clear() 와 같이 타입이 무엇이든 상관없이 수행이 가능한 메소드들이 있다. 이럴 때 unbounded wildcard 가 사용된 parameterized type 을 사용하면 유연한 코드 작성이 가능하다.

# Type erasure

자바 컴파일러는 컴파일 과정에서 제네릭에 대해 타입 소거(Type erasure)를 진행한다. 타입 소거란 타입정보를 컴파일 타임에만 유지하고, 런타임에는 삭제시켜 버리는 것인데 과거 제네릭이 없던 버전과의 하위 호환성을 위해서이다.

타입소거가 이루어진 클래스는 다음과 같다.

```java
// 타입소거 전
class GenericClass <T> {

    public void consume(T paramenter) {
        paramenter.toString();
    }
}

// 타입소거 후
class GenericClass {

    public void consume(Object paramenter) {
        paramenter.toString();
    }
}
```

컴파일러는 Unbound type 에 대하여 Object 로 바꿔버렸다. 따라서 런타임에는 해당 타입이 본래 어떤 타입이었는지 알 수 없다. 타입 소거에 대한 동작은 다음과 같다.

- Unbound type 의 경우 Object, bound type 의 경우 bound 값을 기준으로 타입을 바꾼다.
- 필요에 따라 캐스팅 및 bridge 메소드가 추가될 수 도 있다.

## Non-Reifiable Type

런타임에 타입 정보의 유무에 따라 Reifialbe type, Non - Reifialbe type 으로 구분한다.

- Refiable type : 런타임에 타입에 대한 정보를 가지고 있다. 대표적으로 primitive, non - generic, unbounded wildcards (<?>) 등 이 있다.
- Non - Reifiable type : 런타임에 타입에 대한 정보가 없다. 대표적으로 type erasure 가 진행되는 대부분의 generic parameterized type 이 있다.

제네릭이 가지는 한계점은 대부분 이 타입 소거라는 특징 때문에 발생할 만큼 기억해둬야할 원리다. 타입 소거로 인한 이슈를 피하기 위한 기법 [super type token](https://www.baeldung.com/java-super-type-tokens) 이 나오기도 했다.

# 제네릭의 한계점

## 원시값을 제네릭 타입으로 사용할 수 없다

```java
List<int> numbers = new ArrayList<>(); // compile time error
List<Integer> numbers = new ArrayList<>(); // Ok
```

원시값을 사용하기 위해서는 Wrapper class 를 사용해야한다. 허용되지 않는 이유가 타입소거 때문인줄 알았는데 컴파일러 구현 이슈 때문이라는 의견이 있었다. 이 부분은 좀 더 정확한 정보를 찾게 되면 다시 업데이트가 필요하다.

## 제네릭 타입의 인스턴스를 생성할 수 없다

```java
public <E> E createInstance() {
    E instnace = new E(); // compile time error
    return E;
}
```

이유는 타입소거로 인하여 생성해야할 타입이 무엇인지 알 수 없기 때문이다. 꼭 생성이 필요할 경우 리플렉션을 이용하면 가능하다.

```java
public <E> E createInstance(Class<E> clazz) {
    E instnace = clazz.newInstance(); // OK
    return E;
}
```

## Parameterized type 을 instanceOf 로 비교할 수 없다

```java
List<Integer> numberes = new ArrayList<>();
        
if (numberes instanceof ArrayList<Integer>) { // compile time error
    // ...
}
```

타입소거의 특징으로 인해 위 코드는 컴파일 되지 않는다. 본래의 List 가 어떤 타입을 담고 있었는지 알 수 없으므로 위와 같은 코드가 무의미해지는 것이다. 예를들어 JVM 은 런타임에 ArrayList\<String\>, ArrayList\<Integer\> 를 구분하지 못한다. 하지만 방법이 아주 없는 것은 아니다. 제네릭 타입 중에 유일하게 타입소거가 되지않는 unbounded wildcard **<?>** 를 이용하면 된다.

```java
List<Integer> numberes = new ArrayList<>();
        
if (numberes instanceof ArrayList<?>) { // Ok
    //...
}
```

## Parameterized type array 를 만들 수 없다

```java
List<String>[] arrayOfTexts = new List<String>[10]; // compile time error
```

위 코드는 컴파일되지 않는다. 만약 Array 를 만드는 것이 허용된다고 가정했을 때 어떤 문제가 있을지 살펴보자.

```java
List<Integer>[] numbers = new List<Integer>[10]; 
Object[] objects = numbers;

objects[0] = new ArrayList<Integer>(); // OK
objects[1] = new ArrayList<String>(); // Exception 을 던져야하지만, 런타임에 인지할 수 없음.
```

배열 초기화 과정부터 이상함을 느꼈을 수 있다. **Array 는 Collection 과 다르게 기본적으로 Convariant 하다**. 즉, A → B 이면 A[ ] → B[ ] 가 성립하기에 objects 를 numbers 로 초기화 하는 것이 가능하다!

그 후에 순차적으로 List\<Integer\>, List\<String\> 를 각 배열원소에 초기화하는데, Array 는 런타임에 일치하지 않는 타입이 들어오면 ArrayStoreException 이 발생하므로 List\<Integer\> 로 초기화 할 때 예외가 발생해야한다. 하지만 타입소거에 의해 각 List 는 런타임에 구별되지 않으므로 예외가 발생하지 않고 초기화가 진행될 것이다. 즉, 타입이 구별되지 않아 배열의 기본동작 규칙이 깨지게 되는 것이다.
이러한 이유로 인해 Parameterized type array 생성은 허용되지 않는다.

## type parameter 의 구분으로 메소드를 overload 할 수 없다

```java
class Test {
    public void execute(List<Integer> numbers) { }
    public void execute(List<String> texts) { }
}
```

자바로 처음 개발을 하면 제법 많이 겪어봤을 케이스이다. 위 코드에서 execute 메소드는 오버로딩 될 수 없다. 타입 소거 과정이 끝나면 모두 List 타입으로 변경되어 똑같은 메소드 시그니쳐를 가지게 되기 때문이다.

# Naming

제네릭이 선언된 대부분의 클래스들이 특정 알파벳만 사용되기 때문에 이것이 문법적으로 강제되는 부분이라고 착각할 수 있지만 실제로는 어떠한 이름을 지어도 상관이 없다.

```java
public class MyClass <SUPERGENERIC> { } // 이렇게 지어도 잘돌아간다.
```

다만 표준으로 사용을 권장하는 알파벳들이 있을 뿐이다. 협업의 관점에서 중요한 포인트 이므로 특별한 이유가 없다면 표준을 따르는 것이 좋다. [가이드](https://docs.oracle.com/javase/tutorial/java/generics/types.html)

- 안드로이드의 Adapater 클래스의 시그니쳐를 보면 제네릭의 의미를 강조하기 위해 표준 표기가 아닌 이름을 사용하기도 했다.

```java
public abstract static class Adapter<VH extends ViewHolder>
```

# Reference

[https://docs.oracle.com/javase/tutorial/java/generics/](https://docs.oracle.com/javase/tutorial/java/generics/)
[https://dzone.com/articles/5-things-you-should-know-about-java-generics](https://dzone.com/articles/5-things-you-should-know-about-java-generics)
[https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)](https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science))
[https://en.wikipedia.org/wiki/Subtyping](https://en.wikipedia.org/wiki/Subtyping)
[https://jojoldu.tistory.com/25](https://jojoldu.tistory.com/25)

