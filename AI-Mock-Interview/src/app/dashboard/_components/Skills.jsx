import React, { useTransition } from "react";
import { useState, } from "react";
import { useForm } from "react-hook-form";
import { languageTags } from "@/components/data/languages";
import { ToolTags } from "@/components/data/Tools";
import { frameworkTags } from "@/components/data/frameworks";
import { addSkills } from "@/app/actions/addSkills";

function Skills() {
  const form = useForm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // State for each category
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const [frameworkSearchTerm, setFrameworkSearchTerm] = useState("");
  const [toolSearchTerm, settoolSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    control,
    setValue,
  } = form;

  // Watch selected skills for each category
  const watchedLanguages = watch("languages") || [];
  const watchedFrameworks = watch("frameworks") || [];
  const watchedTools = watch("tools") || [];

  // Filter tags based on search terms and selected items
  const filteredLanguages = languageTags.filter(
    (tag) =>
      tag.label.toLowerCase().includes(languageSearchTerm.toLowerCase()) &&
      !watchedLanguages.includes(tag.value)
  );

  const filteredFrameworks = frameworkTags.filter(
    (tag) =>
      tag.label.toLowerCase().includes(frameworkSearchTerm.toLowerCase()) &&
      !watchedFrameworks.includes(tag.value)
  );

  const filteredTools = ToolTags.filter(
    (tag) =>
      tag.label.toLowerCase().includes(toolSearchTerm.toLowerCase()) &&
      !watchedTools.includes(tag.value)
  );

  // Skill colors for each category
  const skillColors = {
    languages: "bg-blue-600",
    frameworks: "bg-green-600",
    tools: "bg-purple-600",
  };

  // Handle adding skills for each category
  const handleLanguageAdd = (skill) => {
    if (!watchedLanguages.includes(skill)) {
      setValue("languages", [...watchedLanguages, skill]);
      setLanguageSearchTerm("");
    }
  };

  const handleFrameworkAdd = (skill) => {
    if (!watchedFrameworks.includes(skill)) {
      setValue("frameworks", [...watchedFrameworks, skill]);
      setFrameworkSearchTerm("");
    }
  };

  const handleToolAdd = (skill) => {
    if (!watchedTools.includes(skill)) {
      setValue("tools", [...watchedTools, skill]);
      settoolSearchTerm("");
    }
  };

  // Handle removing skills for each category
  const handleRemoveLanguage = (skillToRemove) => {
    setValue(
      "languages",
      watchedLanguages.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleRemoveFramework = (skillToRemove) => {
    setValue(
      "frameworks",
      watchedFrameworks.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleRemoveTool = (skillToRemove) => {
    setValue(
      "tools",
      watchedTools.filter((skill) => skill !== skillToRemove)
    );
  };

  const onSubmit = async(data) => {
    console.log("Submitted skills:", data);
    startTransition(() => {
         addSkills(data)
           .then((data) => {
             if (data.error) {
               setError(data.error);
               setSuccess(undefined);
             } else if (data.success) {
               setSuccess(data.success);
               setError(undefined);
             }
           })
           .catch(() => setError("Something went wrong!"));
       });
    // Handle form submission here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 transform transition-all hover:shadow-blue-900/20 hover:shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">
          Technical Skills
        </h2>

        {/* Languages Section */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Add Languages
            </label>
            <div className="relative">
              <input
                type="text"
                value={languageSearchTerm}
                onChange={(e) => setLanguageSearchTerm(e.target.value)}
                placeholder="Search languages..."
                className="w-full bg-gray-700 border border-gray-600 text-white p-3 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {languageSearchTerm && (
            <div className="bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleLanguageAdd(tag.value)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-600 rounded-md transition-colors text-gray-200"
                  >
                    {tag.label}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 p-2">No matching languages found</p>
              )}
            </div>
          )}

          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Selected Languages
            </label>

            <div className="bg-gray-700 border border-gray-600 rounded-md p-4 min-h-24">
              {watchedLanguages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {watchedLanguages.map((skill) => (
                    <span
                      key={skill}
                      className={`${skillColors.languages} text-white px-3 py-1.5 text-sm flex items-center gap-1 rounded-full shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(skill)}
                        className="ml-1 hover:text-red-300 transition-colors focus:outline-none"
                        aria-label={`Remove ${skill}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No languages selected yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Frameworks Section */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Add Frameworks
            </label>
            <div className="relative">
              <input
                type="text"
                value={frameworkSearchTerm}
                onChange={(e) => setFrameworkSearchTerm(e.target.value)}
                placeholder="Search frameworks..."
                className="w-full bg-gray-700 border border-gray-600 text-white p-3 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {frameworkSearchTerm && (
            <div className="bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
              {filteredFrameworks.length > 0 ? (
                filteredFrameworks.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleFrameworkAdd(tag.value)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-600 rounded-md transition-colors text-gray-200"
                  >
                    {tag.label}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 p-2">
                  No matching frameworks found
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Selected Frameworks
            </label>

            <div className="bg-gray-700 border border-gray-600 rounded-md p-4 min-h-24">
              {watchedFrameworks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {watchedFrameworks.map((skill) => (
                    <span
                      key={skill}
                      className={`${skillColors.frameworks} text-white px-3 py-1.5 text-sm flex items-center gap-1 rounded-full shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveFramework(skill)}
                        className="ml-1 hover:text-red-300 transition-colors focus:outline-none"
                        aria-label={`Remove ${skill}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No frameworks selected yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-6">
          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Add Tools
            </label>
            <div className="relative">
              <input
                type="text"
                value={toolSearchTerm}
                onChange={(e) => settoolSearchTerm(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-gray-700 border border-gray-600 text-white p-3 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {toolSearchTerm && (
            <div className="bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
              {filteredTools.length > 0 ? (
                filteredTools.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleToolAdd(tag.value)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-600 rounded-md transition-colors text-gray-200"
                  >
                    {tag.label}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 p-2">No matching tools found</p>
              )}
            </div>
          )}

          <div>
            <label className="text-gray-300 font-medium block mb-2">
              Selected Tools
            </label>

            <div className="bg-gray-700 border border-gray-600 rounded-md p-4 min-h-24">
              {watchedTools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {watchedTools.map((skill) => (
                    <span
                      key={skill}
                      className={`${skillColors.tools} text-white px-3 py-1.5 text-sm flex items-center gap-1 rounded-full shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(skill)}
                        className="ml-1 hover:text-red-300 transition-colors focus:outline-none"
                        aria-label={`Remove ${skill}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No tools selected yet
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md mt-6"
        >
          Save Skills
        </button>
      </div>
    </form>
  );
}

export default Skills;
