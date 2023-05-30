import assert from "assert";

class Stack<T> {
  private capacity;
  private data: T[];
  private pointer = 0;
  private size = 0;

  constructor(capacity: number) {
    this.data = new Array<T>(capacity);
    this.capacity = capacity;
  }

  push(item: T) {
    this.data[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  pop() {
    assert(this.size > 0, "Stack is empty");

    this.pointer = (this.pointer - 1 + this.capacity) % this.capacity;
    const item = this.data[this.pointer];
    this.size--;
    return item;
  }

  peek() {
    return this.data[(this.pointer - 1 + this.capacity) % this.capacity];
  }

  get length() {
    return this.data.length;
  }

  isEmpty() {
    return this.size === 0;
  }

  dumpAll(): T[] {
    const allData = [];
    while (!this.isEmpty()) {
      allData.push(this.pop());
    }
    return allData as T[];
  }
}

export default Stack;
