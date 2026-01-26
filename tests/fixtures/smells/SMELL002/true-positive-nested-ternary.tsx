// TRUE POSITIVE: Deeply nested ternary (should be flagged)
// Expected: SMELL002 finding

function MyComponent({ status, error, data }) {
  return (
    <div>
      {/* 3-level nested ternary - should be flagged */}
      {status === "loading" ? (
        <Spinner />
      ) : status === "error" ? (
        error ? (
          <Error message={error} />
        ) : (
          <Empty />
        )
      ) : data ? (
        <Content data={data} />
      ) : (
        <Empty />
      )}
    </div>
  );
}

function anotherFunction() {
  // 2-level nested ternary in regular code - should be flagged
  const result = condition1 ? value1 : condition2 ? value2 : value3;
  return result;
}
