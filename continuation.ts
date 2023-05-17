type Value = number | PlaceHolder;

class PlaceHolder {
  static id = 0;
  id: number;
  constructor() {
    this.id = PlaceHolder.id++;
  }
}

class Continuation {
  public result = undefined;
  constructor(
    public f: Function,
    public args: Value[],
    public next?: Continuation
  ) {}
}

class ContinuationInterpreter {
  hash: { [key: number]: Continuation } = {};
  constructor() {}

  build(code: any) {
    this._build(code);
    this.setNext();
  }
  private _build(code: any) {
    if (typeof code === 'number') {
      return code;
    } else if (code instanceof Array) {
      const [func, ...args] = code;
      const newArgs = args.map((e) => this._build(e));
      const ph = new PlaceHolder();
      this.hash[ph.id] = new Continuation(func, newArgs);
      return ph;
    } else {
      throw new Error('compile error');
    }
  }
  private setNext() {
    for (let i = 0; i < Object.keys(this.hash).length; i++) {
      this.hash[i].next = this.hash[i + 1];
    }
  }
  eval() {
    const root = this.hash[0];
    this._eval(root);
  }
  private _eval(cont: Continuation) {
    const appliedArgs = cont.args.map((arg) => {
      if (arg instanceof PlaceHolder) {
        const ph = arg as PlaceHolder;
        if (!this.hash[ph.id]?.result) throw new Error('Continuation: apply()');
        return this.hash[ph.id].result!;
      } else {
        return arg;
      }
    });
    cont.result = cont.f(...appliedArgs);
    if (cont.next) {
      this._eval(cont.next);
    }
  }
}

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;
const add3 = (a: number, b: number, c: number) => a + b + c;
const p = (a: number) => console.log(a);

const ci = new ContinuationInterpreter();
const code = [
  p,
  [sub, [add, 1, 2], [add, [sub, 3, 2], [add3, 1, 2, [sub, 2, 1]]]],
];
ci.build(code);

// (1 + 2) - (3 - 2) + (1 + 2 + (2 - 1)) == -2
ci.eval();
