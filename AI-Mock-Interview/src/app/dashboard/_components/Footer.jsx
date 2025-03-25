import React from 'react'
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn,FaGithub } from 'react-icons/fa';
function Footer() {
  return (
    <div>
                <div className="w-[120vh] h-1 bg-[#00a2ec]  mx-auto"></div>
       
          <footer className="bg-[#232a34] text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Master Your Interviews</h3>
                  <p className="text-gray-400">Empowering your interview success journey</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    {["About", "Services", "Pricing", "Contact"].map((link) => (
                      <li key={link}>
                        <a href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors duration-300">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>contact@masteryourinterviews.com</li>
                    <li>+1 (123) 456-7890</li>
                    <li>123 Interview Street, NY 10001</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    {[FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn].map((Icon, index) => (
                      <a
                        key={index}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        <Icon size={24} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                <p>© 2024 Master Your Interviews. All rights reserved.</p>
              </div>
            </div>
          </footer>
    </div>
  )
}

export default Footer
