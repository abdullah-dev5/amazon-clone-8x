import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 bg-[#232f3e] text-white">
      <a
        href="#top"
        className="block w-full bg-[#37475a] py-3 text-center text-sm hover:bg-[#485769]"
      >
        Back to top
      </a>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 text-sm sm:grid-cols-4">
        <div>
          <h4 className="mb-3 font-bold">Get to Know Us</h4>
          <ul className="space-y-2 text-gray-300">
            <li>About amazonw</li>
            <li>Careers</li>
            <li>Press Releases</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Make Money with Us</h4>
          <ul className="space-y-2 text-gray-300">
            <li>Sell products</li>
            <li>Become an Affiliate</li>
            <li>Advertise Your Products</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Payment Products</h4>
          <ul className="space-y-2 text-gray-300">
            <li>Gift Cards</li>
            <li>Reload Balance</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Let Us Help You</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/account" className="hover:underline hover:text-white">
                Your Account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:underline hover:text-white">
                Your Orders
              </Link>
            </li>
            <li>Help</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-600 py-6 text-center text-xs text-gray-400">
        This is a portfolio recreation of the Amazon.com shopping experience, built as a
        learning exercise. Not affiliated with or endorsed by Amazon.com, Inc.
      </div>
    </footer>
  );
}
