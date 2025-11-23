import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-[#F5F5F5] min-h-screen items-center justify-start flex flex-col p-12 relative">
      <Image
        className="absolute bottom-0 left-0"
        src="/images/angel.png"
        alt="angel"
        width={500}
        height={1000}
      />
      <div className="flex items-center gap-2">
        <Image
          src="/images/logo.png"
          alt="okayokayokay"
          width={134}
          height={134}
        />
        <h1 className="text-4xl text-red-500 font-bold text-[75px]">
          okayokayokay
        </h1>
      </div>

      <p className="text-center text-black font-figtree text-[30px] not-italic font-normal leading-[46px] tracking-[0.396px]">
        Dispute Arbitration Platform for Agentic Commerce
      </p>

      <div className="flex flex-col items-end justify-center mt-[150px] w-full ">
        <h3
          className="text-right text-[48px] leading-[36px] font-normal tracking-[0.396px]"
          style={{ color: "#F71735", fontFamily: "var(--font-dalfitra)" }}
        >
          Disputes Are Good for Web3, Actually
        </h3>
        <p className="text-right text-[30px] font-normal tracking-[0.396px] max-w-1/2">
          Three layers of resolution that make rugging harder and building
          better. This is how we make DeFi safe for your agents and your mom’s
          agents.
        </p>
      </div>

      <div>
        <div className="relative h-[700px] w-[1000px] overflow-hidden mt-[50px]">
          <Image
            src="/images/iron-shape.png"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            alt="iron shield"
            width={1000}
            height={500}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
            <h4 className="text-[30px] font-normal tracking-[0.396px] text-center">
              AI Agents Are Trading Billions. With Zero Protection.
            </h4>
            <p className="text-black text-center font-figtree text-[24px] not-italic leading-[34px] tracking-[0.396px]">
              Welcome to agentic commerce: Your AI agents execute thousands of
              transactions daily - buying compute, accessing APIs, trading
              tokens, paying for services. But when they get bad data, wrong
              schemas, or straight-up rugged?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
